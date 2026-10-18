import { getStore } from "@/backend/db/store";
import { currentTeacher, decoyHash, endSession, hashPassword, newId, sameOrigin, startSession, verifyPassword } from "@/backend/lib/auth";
import { clientId, json, rateLimit } from "@/backend/lib/guard";
import { MIN_PASSWORD, SignInRequest, SignUpRequest, type TeacherClass, type TeacherProfile } from "@/shared/classes";
import { failed, forbidden, signedOut, tooMany, unavailable } from "./classes";

const body = (req: Request) => req.json().catch(() => null);

/** A teacher creates an account and is signed in. */
export async function signUp(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  if (!sameOrigin(req)) return forbidden();
  const limit = rateLimit(`teacher-signup:${clientId(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const parsed = SignUpRequest.safeParse(await body(req));
  if (!parsed.success) {
    return json({ error: `Enter your name, a valid email and a password of at least ${MIN_PASSWORD} characters.` }, 400);
  }
  const { name, email, password } = parsed.data;
  try {
    const id = newId();
    if (!(await store.createTeacher({ id, email, name, passwordHash: await hashPassword(password) }))) {
      return json({ error: "There's already an account with that email. Sign in instead." }, 409);
    }
    const profile: TeacherProfile = { name, email };
    return json(profile, 201, { "set-cookie": await startSession(store, id) });
  } catch {
    return failed();
  }
}

/** A teacher signs in with email and password. */
export async function signIn(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  if (!sameOrigin(req)) return forbidden();
  const parsed = SignInRequest.safeParse(await body(req));
  const wrong = () => json({ error: "That email and password don't match an account." }, 401);
  if (!parsed.success) return wrong();
  const { email, password } = parsed.data;
  // Limit guesses per visitor and per account.
  const byClient = rateLimit(`teacher-signin:${clientId(req)}`, 10, 10 * 60 * 1000);
  const byEmail = rateLimit(`teacher-signin-email:${email}`, 10, 10 * 60 * 1000);
  if (!byClient.ok || !byEmail.ok) return tooMany(Math.max(byClient.ok ? 0 : byClient.retryAfter, byEmail.ok ? 0 : byEmail.retryAfter));
  try {
    const teacher = await store.teacherByEmail(email);
    // Check a decoy hash for unknown emails, so a reply's timing doesn't reveal who has an account.
    const ok = await verifyPassword(password, teacher?.passwordHash ?? (await decoyHash()));
    if (!teacher || !ok) return wrong();
    const profile: TeacherProfile = { name: teacher.name, email: teacher.email };
    return json(profile, 200, { "set-cookie": await startSession(store, teacher.id) });
  } catch {
    return failed();
  }
}

export async function signOut(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  if (!sameOrigin(req)) return forbidden();
  try {
    return json({ ok: true }, 200, { "set-cookie": await endSession(store, req) });
  } catch {
    return failed();
  }
}

/** The signed-in teacher and their classes. (Reading the cookie keeps this route dynamic.) */
export async function me(req: Request) {
  const store = getStore();
  if (!store) return unavailable();
  try {
    const teacher = await currentTeacher(store, req);
    if (!teacher) return signedOut();
    const classes: TeacherClass[] = await store.teacherClasses(teacher.id);
    return json({ teacher: { name: teacher.name, email: teacher.email } satisfies TeacherProfile, classes });
  } catch {
    return failed();
  }
}
