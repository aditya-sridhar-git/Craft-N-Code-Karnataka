import { randomInt } from "node:crypto";
import { getStore, type Store } from "@/backend/db/store";
import { currentTeacher, sameOrigin } from "@/backend/lib/auth";
import { clientId, json, rateLimit } from "@/backend/lib/guard";
import { CODE_ALPHABET, CODE_LENGTH, ClassCodeRequest, CreateClassRequest, SubmitResultRequest, type ClassView } from "@/shared/classes";

const MAX_SHOWN = 500;

const newCode = () => Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export const unavailable = () => json({ error: "Teacher accounts and classes aren't switched on for this site yet." }, 503);
export const failed = () => json({ error: "Something went wrong with the class service. Please try again." }, 500);
export const tooMany = (retryAfter: number) =>
  json({ error: "Too many requests in a short time. Please wait a few minutes." }, 429, { "retry-after": String(retryAfter) });
export const forbidden = () => json({ error: "That request didn't come from this site." }, 403);
export const signedOut = () => json({ error: "Please sign in as a teacher." }, 401);
const notFound = () => json({ error: "No class has that code. Check it with your teacher." }, 404);
const notYours = () => json({ error: "That class isn't one of yours, or it was deleted." }, 404);

const body = (req: Request) => req.json().catch(() => null);

/** The signed-in teacher's own class, or the response to send instead. */
async function ownClass(store: Store, req: Request) {
  const teacher = await currentTeacher(store, req);
  if (!teacher) return { error: signedOut() };
  const parsed = ClassCodeRequest.safeParse(await body(req));
  if (!parsed.success) return { error: notYours() };
  const row = await store.findClass(parsed.data.code);
  if (!row || row.teacherId !== teacher.id) return { error: notYours() };
  return { row };
}

/** A signed-in teacher makes a class and gets its join code. */
export async function createClass(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  if (!sameOrigin(req)) return forbidden();
  const limit = rateLimit(`class-create:${clientId(req)}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  try {
    const teacher = await currentTeacher(store, req);
    if (!teacher) return signedOut();
    const parsed = CreateClassRequest.safeParse(await body(req));
    if (!parsed.success) return json({ error: "Give the class a name of 2 to 60 characters." }, 400);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode();
      if (await store.createClass({ code, name: parsed.data.name, teacherId: teacher.id })) return json({ code, name: parsed.data.name }, 201);
    }
    return failed();
  } catch {
    return failed();
  }
}

/** A student checks a join code before using it. No sign-in: students never have accounts. */
export async function joinClass(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  const limit = rateLimit(`class-join:${clientId(req)}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const parsed = ClassCodeRequest.safeParse(await body(req));
  if (!parsed.success) return notFound();
  try {
    const row = await store.findClass(parsed.data.code);
    return row ? json({ code: row.code, name: row.name }) : notFound();
  } catch {
    return failed();
  }
}

/** A student's finished check-up, without any name or identifier, is added to the class. */
export async function submitResult(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  const limit = rateLimit(`class-submit:${clientId(req)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const parsed = SubmitResultRequest.safeParse(await body(req));
  if (!parsed.success) return json({ error: "That result couldn't be read." }, 400);
  const { code, result } = parsed.data;
  const perClass = rateLimit(`class-submit-to:${code}`, 300, 60 * 60 * 1000);
  if (!perClass.ok) return tooMany(perClass.retryAfter);
  try {
    if (!(await store.findClass(code))) return notFound();
    await store.addResult(code, result);
    return json({ ok: true }, 201);
  } catch {
    return failed();
  }
}

/** The dashboard's data for one of the signed-in teacher's classes. */
export async function viewClass(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  const limit = rateLimit(`class-view:${clientId(req)}`, 60, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  try {
    const own = await ownClass(store, req);
    if (own.error) return own.error;
    const { row } = own;
    const view: ClassView = { code: row.code, name: row.name, createdAt: row.createdAt, results: await store.results(row.code, MAX_SHOWN) };
    return json(view);
  } catch {
    return failed();
  }
}

/** The teacher deletes one of their classes and every result in it. */
export async function deleteClass(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  if (!sameOrigin(req)) return forbidden();
  const limit = rateLimit(`class-delete:${clientId(req)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  try {
    const own = await ownClass(store, req);
    if (own.error) return own.error;
    await store.removeClass(own.row.code);
    return json({ ok: true });
  } catch {
    return failed();
  }
}
