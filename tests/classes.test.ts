import { describe, expect, it, vi } from "vitest";
import { ClassResult, CODE_ALPHABET, CODE_LENGTH, normaliseCode, summariseGaps, type StoredResult } from "@/shared/classes";

// The handlers are server-only; its guard package is a no-op outside a client bundle.
vi.mock("server-only", () => ({}));
const classes = await import("@/backend/handlers/classes");
const teacher = await import("@/backend/handlers/teacher");
const { hashPassword, verifyPassword } = await import("@/backend/lib/auth");

const result = (over: Partial<ClassResult> = {}): ClassResult => ({
  topicTitle: "Projectile motion",
  subject: "physics",
  grade: 11,
  rootSkillId: "trig-ratios",
  rootTitle: "Trigonometric ratios",
  misconception: "Swaps sine and cosine",
  confidence: "high",
  noGap: false,
  questions: 14,
  ...over,
});

let ip = 0;
async function call(fn: (req: Request) => Promise<Response>, body?: unknown, opts: { cookie?: string; from?: string; origin?: string } = {}) {
  const headers: Record<string, string> = { "x-forwarded-for": opts.from ?? `10.0.0.${++ip}`, host: "taproot.test" };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.origin) headers.origin = opts.origin;
  const req = new Request("http://taproot.test/api", body === undefined ? { headers } : { method: "POST", headers, body: JSON.stringify(body) });
  const res = await fn(req);
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, data: await res.json(), cookie: setCookie?.split(";")[0] ?? null, setCookie };
}

let n = 0;
const newTeacher = async (name = "Asha Rao") => {
  const email = `teacher${++n}@school.test`;
  const res = await call(teacher.signUp, { name, email, password: "correct horse" });
  expect(res.status).toBe(201);
  return { email, cookie: res.cookie! };
};

describe("class codes", () => {
  it("normalises what a student types", () => {
    expect(normaliseCode(" k7q-3mx ")).toBe("K7Q3MX");
  });

  it("uses only unambiguous characters", () => {
    for (const c of "01OIL") expect(CODE_ALPHABET).not.toContain(c);
  });
});

describe("summariseGaps", () => {
  const stored = (over: Partial<ClassResult>, id: number): StoredResult => ({ ...result(over), id: String(id), createdAt: new Date(0).toISOString() });

  it("groups by root gap, most common first, and skips no-gap results", () => {
    const gaps = summariseGaps([
      stored({}, 1),
      stored({ topicTitle: "Heights and distances" }, 2),
      stored({ misconception: "Uses the wrong side" }, 3),
      stored({ rootSkillId: "fractions", rootTitle: "Fractions", misconception: null }, 4),
      stored({ noGap: true, rootSkillId: null, rootTitle: null, misconception: null, confidence: null }, 5),
    ]);
    expect(gaps.map((g) => [g.rootTitle, g.count])).toEqual([
      ["Trigonometric ratios", 3],
      ["Fractions", 1],
    ]);
    expect(gaps[0].misconceptions[0]).toEqual({ label: "Swaps sine and cosine", count: 2 });
    expect(gaps[0].topics).toEqual(["Projectile motion", "Heights and distances"]);
  });
});

describe("passwords", () => {
  it("are salted scrypt hashes that verify only the right password", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).toMatch(/^scrypt\$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", a)).toBe(true);
    expect(await verifyPassword("wrong horse", a)).toBe(false);
  });
});

describe("teacher accounts", () => {
  it("signs up, signs in and out, and the session cookie is HttpOnly", async () => {
    const email = "ravi@school.test";
    const up = await call(teacher.signUp, { name: "Ravi K", email: " Ravi@School.test ", password: "correct horse" });
    expect(up.status).toBe(201);
    expect(up.data).toEqual({ name: "Ravi K", email });
    expect(up.setCookie).toMatch(/HttpOnly/);
    expect(up.setCookie).toMatch(/SameSite=Lax/);

    expect((await call(teacher.signUp, { name: "Someone", email, password: "another pass" })).status).toBe(409);
    expect((await call(teacher.signIn, { email, password: "wrong password" })).status).toBe(401);
    expect((await call(teacher.signIn, { email: "nobody@school.test", password: "correct horse" })).status).toBe(401);

    const signedIn = await call(teacher.signIn, { email, password: "correct horse" });
    expect(signedIn.status).toBe(200);
    expect((await call(teacher.me, undefined, { cookie: signedIn.cookie! })).data.teacher).toEqual({ name: "Ravi K", email });

    await call(teacher.signOut, {}, { cookie: signedIn.cookie! });
    expect((await call(teacher.me, undefined, { cookie: signedIn.cookie! })).status).toBe(401);
    expect((await call(teacher.me)).status).toBe(401);
  });

  it("rejects a weak sign-up", async () => {
    expect((await call(teacher.signUp, { name: "A B", email: "x@school.test", password: "short" })).status).toBe(400);
    expect((await call(teacher.signUp, { name: "A B", email: "not-an-email", password: "long enough" })).status).toBe(400);
  });

  it("refuses requests from another site", async () => {
    expect((await call(teacher.signIn, { email: "a@b.co", password: "x" }, { origin: "https://evil.example" })).status).toBe(403);
    const { cookie } = await newTeacher();
    expect((await call(classes.createClass, { name: "10 B" }, { cookie, origin: "https://evil.example" })).status).toBe(403);
    expect((await call(classes.createClass, { name: "10 B" }, { cookie, origin: "http://taproot.test" })).status).toBe(201);
  });

  it("limits sign-in guesses per account", async () => {
    const { email } = await newTeacher();
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await call(teacher.signIn, { email, password: `guess ${i}` })).status);
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe("classes", () => {
  it("runs the whole flow: create, join, submit, view, delete", async () => {
    const { cookie } = await newTeacher();
    expect((await call(classes.createClass, { name: "10 B Maths" })).status).toBe(401);

    const made = await call(classes.createClass, { name: "10 B Maths" }, { cookie });
    expect(made.status).toBe(201);
    expect(made.data.code).toMatch(new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`));
    const { code } = made.data;

    // Students need no sign-in to join or submit.
    expect((await call(classes.joinClass, { code })).data).toEqual({ code, name: "10 B Maths" });
    expect((await call(classes.submitResult, { code, result: result() })).status).toBe(201);
    expect((await call(classes.submitResult, { code, result: result({ noGap: true, rootSkillId: null, rootTitle: null, misconception: null, confidence: null }) })).status).toBe(201);

    const mine = await call(teacher.me, undefined, { cookie });
    expect(mine.data.classes).toEqual([expect.objectContaining({ code, name: "10 B Maths", results: 2 })]);

    const view = await call(classes.viewClass, { code }, { cookie });
    expect(view.status).toBe(200);
    expect(view.data.results).toHaveLength(2);
    expect(view.data.results[1].rootTitle).toBe("Trigonometric ratios");
    // Nothing that could identify a student is stored or returned.
    expect(Object.keys(view.data.results[0]).sort()).toEqual([...Object.keys(result()), "createdAt", "id"].sort());

    // Another teacher can't see or delete it, and neither can a signed-out visitor.
    const other = await newTeacher("Meera S");
    expect((await call(classes.viewClass, { code }, { cookie: other.cookie })).status).toBe(404);
    expect((await call(classes.deleteClass, { code }, { cookie: other.cookie })).status).toBe(404);
    expect((await call(classes.viewClass, { code })).status).toBe(401);

    expect((await call(classes.deleteClass, { code }, { cookie })).status).toBe(200);
    expect((await call(classes.joinClass, { code })).status).toBe(404);
    expect((await call(classes.submitResult, { code, result: result() })).status).toBe(404);
  });

  it("rejects bad input", async () => {
    const { cookie } = await newTeacher();
    expect((await call(classes.createClass, { name: "x" }, { cookie })).status).toBe(400);
    expect((await call(classes.joinClass, { code: "short" })).status).toBe(404);
    expect((await call(classes.submitResult, { code: "ABCDEF", result: { ...result(), studentName: "Asha" } })).status).toBe(404);
    expect((await call(classes.submitResult, { code: "ABCDEF", result: { ...result(), grade: 40 } })).status).toBe(400);
  });

  it("drops any extra fields a client sends, such as a name", () => {
    const parsed = ClassResult.parse({ ...result(), studentName: "Asha" });
    expect(parsed).not.toHaveProperty("studentName");
  });
});
