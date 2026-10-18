import "server-only";
import { neon } from "@neondatabase/serverless";
import { RETENTION_DAYS, type ClassResult, type StoredResult } from "@/shared/classes";

/*
 * Storage for teacher accounts, their sign-in sessions, classes and class results. On Vercel this
 * is Postgres (Neon, added from the project's Storage tab, which sets DATABASE_URL). Without a
 * database URL, local development and tests use an in-memory store; a production build without one
 * reports accounts and classes as unavailable. Students never have accounts.
 */

export interface TeacherRow {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export type Teacher = Omit<TeacherRow, "passwordHash">;

export interface ClassRow {
  code: string;
  name: string;
  teacherId: string;
  createdAt: string;
}

export interface ClassSummary {
  code: string;
  name: string;
  createdAt: string;
  results: number;
}

export interface Store {
  readonly kind: "postgres" | "memory";
  /** Returns false if the email is already registered. */
  createTeacher(row: TeacherRow): Promise<boolean>;
  teacherByEmail(email: string): Promise<TeacherRow | null>;
  createSession(tokenHash: string, teacherId: string, expiresAt: Date): Promise<void>;
  /** The signed-in teacher for a session, or null if it doesn't exist or has expired. */
  sessionTeacher(tokenHash: string): Promise<Teacher | null>;
  deleteSession(tokenHash: string): Promise<void>;
  /** Returns false if the code is already taken. */
  createClass(row: Omit<ClassRow, "createdAt">): Promise<boolean>;
  findClass(code: string): Promise<ClassRow | null>;
  teacherClasses(teacherId: string): Promise<ClassSummary[]>;
  addResult(code: string, result: ClassResult): Promise<void>;
  results(code: string, limit: number): Promise<StoredResult[]>;
  removeClass(code: string): Promise<void>;
}

const MAX_RESULTS_PER_CLASS = 2000;
const iso = (v: unknown) => new Date(v as string).toISOString();

/* ── Postgres ──────────────────────────────────────────────────────────────── */

function postgresStore(url: string): Store {
  const sql = neon(url);

  // Tables are created on first use, so a fresh database needs no migration step.
  let ready: Promise<unknown> | null = null;
  const init = () =>
    (ready ??= sql
      .transaction([
        sql`CREATE TABLE IF NOT EXISTS teachers (
          id text PRIMARY KEY,
          email text NOT NULL UNIQUE,
          name text NOT NULL,
          password_hash text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )`,
        sql`CREATE TABLE IF NOT EXISTS teacher_sessions (
          token_hash text PRIMARY KEY,
          teacher_id text NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL
        )`,
        sql`CREATE TABLE IF NOT EXISTS classes (
          code text PRIMARY KEY,
          name text NOT NULL,
          teacher_id text NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
          created_at timestamptz NOT NULL DEFAULT now()
        )`,
        sql`CREATE INDEX IF NOT EXISTS classes_by_teacher ON classes (teacher_id, created_at DESC)`,
        sql`CREATE TABLE IF NOT EXISTS class_results (
          id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          class_code text NOT NULL REFERENCES classes(code) ON DELETE CASCADE,
          topic_title text NOT NULL,
          subject text NOT NULL,
          grade smallint NOT NULL,
          root_skill_id text,
          root_title text,
          misconception text,
          confidence text,
          no_gap boolean NOT NULL,
          questions smallint NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )`,
        sql`CREATE INDEX IF NOT EXISTS class_results_by_class ON class_results (class_code, created_at DESC)`,
      ])
      .catch((e) => {
        ready = null;
        throw e;
      }));

  // Retention runs at most once an hour per server instance.
  let lastSweep = 0;
  const sweep = async () => {
    if (Date.now() - lastSweep < 60 * 60 * 1000) return;
    lastSweep = Date.now();
    await sql.transaction([
      sql`DELETE FROM class_results WHERE created_at < now() - make_interval(days => ${RETENTION_DAYS})`,
      sql`DELETE FROM teacher_sessions WHERE expires_at < now()`,
    ]);
  };

  return {
    kind: "postgres",
    async createTeacher({ id, email, name, passwordHash }) {
      await init();
      const rows = await sql`INSERT INTO teachers (id, email, name, password_hash) VALUES (${id}, ${email}, ${name}, ${passwordHash})
                             ON CONFLICT (email) DO NOTHING RETURNING id`;
      return rows.length === 1;
    },
    async teacherByEmail(email) {
      await init();
      const [row] = await sql`SELECT id, email, name, password_hash FROM teachers WHERE email = ${email}`;
      return row ? { id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash } : null;
    },
    async createSession(tokenHash, teacherId, expiresAt) {
      await init();
      await sweep();
      await sql`INSERT INTO teacher_sessions (token_hash, teacher_id, expires_at) VALUES (${tokenHash}, ${teacherId}, ${expiresAt.toISOString()})`;
    },
    async sessionTeacher(tokenHash) {
      await init();
      const [row] = await sql`SELECT t.id, t.email, t.name FROM teacher_sessions s JOIN teachers t ON t.id = s.teacher_id
                              WHERE s.token_hash = ${tokenHash} AND s.expires_at > now()`;
      return row ? { id: row.id, email: row.email, name: row.name } : null;
    },
    async deleteSession(tokenHash) {
      await init();
      await sql`DELETE FROM teacher_sessions WHERE token_hash = ${tokenHash}`;
    },
    async createClass({ code, name, teacherId }) {
      await init();
      const rows = await sql`INSERT INTO classes (code, name, teacher_id) VALUES (${code}, ${name}, ${teacherId}) ON CONFLICT (code) DO NOTHING RETURNING code`;
      return rows.length === 1;
    },
    async findClass(code) {
      await init();
      const [row] = await sql`SELECT code, name, teacher_id, created_at FROM classes WHERE code = ${code}`;
      return row ? { code: row.code, name: row.name, teacherId: row.teacher_id, createdAt: iso(row.created_at) } : null;
    },
    async teacherClasses(teacherId) {
      await init();
      const rows = await sql`SELECT c.code, c.name, c.created_at, count(r.id)::int AS results
                             FROM classes c LEFT JOIN class_results r ON r.class_code = c.code
                             WHERE c.teacher_id = ${teacherId} GROUP BY c.code ORDER BY c.created_at DESC`;
      return rows.map((row) => ({ code: row.code, name: row.name, createdAt: iso(row.created_at), results: row.results }));
    },
    async addResult(code, r) {
      await init();
      await sweep();
      // Keep each class to a bounded size: drop the oldest beyond the cap.
      await sql.transaction([
        sql`INSERT INTO class_results (class_code, topic_title, subject, grade, root_skill_id, root_title, misconception, confidence, no_gap, questions)
            VALUES (${code}, ${r.topicTitle}, ${r.subject}, ${r.grade}, ${r.rootSkillId}, ${r.rootTitle}, ${r.misconception}, ${r.confidence}, ${r.noGap}, ${r.questions})`,
        sql`DELETE FROM class_results WHERE class_code = ${code} AND id NOT IN (
              SELECT id FROM class_results WHERE class_code = ${code} ORDER BY created_at DESC LIMIT ${MAX_RESULTS_PER_CLASS})`,
      ]);
    },
    async results(code, limit) {
      await init();
      const rows = await sql`SELECT * FROM class_results WHERE class_code = ${code} ORDER BY created_at DESC, id DESC LIMIT ${limit}`;
      return rows.map((row) => ({
        id: String(row.id),
        createdAt: iso(row.created_at),
        topicTitle: row.topic_title,
        subject: row.subject,
        grade: row.grade,
        rootSkillId: row.root_skill_id,
        rootTitle: row.root_title,
        misconception: row.misconception,
        confidence: row.confidence,
        noGap: row.no_gap,
        questions: row.questions,
      }));
    },
    async removeClass(code) {
      await init();
      await sql`DELETE FROM classes WHERE code = ${code}`;
    },
  };
}

/* ── In memory (development and tests) ─────────────────────────────────────── */

function memoryStore(): Store {
  const teachers = new Map<string, TeacherRow>();
  const sessions = new Map<string, { teacherId: string; expiresAt: number }>();
  const classes = new Map<string, ClassRow>();
  const results = new Map<string, StoredResult[]>();
  let nextId = 1;
  const strip = ({ id, email, name }: TeacherRow): Teacher => ({ id, email, name });
  return {
    kind: "memory",
    async createTeacher(row) {
      if ([...teachers.values()].some((t) => t.email === row.email)) return false;
      teachers.set(row.id, row);
      return true;
    },
    async teacherByEmail(email) {
      return [...teachers.values()].find((t) => t.email === email) ?? null;
    },
    async createSession(tokenHash, teacherId, expiresAt) {
      sessions.set(tokenHash, { teacherId, expiresAt: expiresAt.getTime() });
    },
    async sessionTeacher(tokenHash) {
      const s = sessions.get(tokenHash);
      const t = s && s.expiresAt > Date.now() ? teachers.get(s.teacherId) : undefined;
      return t ? strip(t) : null;
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash);
    },
    async createClass(row) {
      if (classes.has(row.code)) return false;
      classes.set(row.code, { ...row, createdAt: new Date().toISOString() });
      results.set(row.code, []);
      return true;
    },
    async findClass(code) {
      return classes.get(code) ?? null;
    },
    async teacherClasses(teacherId) {
      return [...classes.values()]
        .filter((c) => c.teacherId === teacherId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((c) => ({ code: c.code, name: c.name, createdAt: c.createdAt, results: results.get(c.code)?.length ?? 0 }));
    },
    async addResult(code, r) {
      const list = results.get(code);
      if (!list) return;
      list.unshift({ ...r, id: String(nextId++), createdAt: new Date().toISOString() });
      list.length = Math.min(list.length, MAX_RESULTS_PER_CLASS);
    },
    async results(code, limit) {
      return (results.get(code) ?? []).slice(0, limit);
    },
    async removeClass(code) {
      classes.delete(code);
      results.delete(code);
    },
  };
}

let store: Store | null | undefined;

/** The store, or null when accounts and classes aren't set up on this deployment. */
export function getStore(): Store | null {
  if (store !== undefined) return store;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) store = postgresStore(url);
  else if (process.env.NODE_ENV !== "production" || process.env.CLASS_MEMORY === "1") {
    // Kept on globalThis so accounts and classes survive hot reloads in development.
    const g = globalThis as { __taprootStore?: Store };
    store = g.__taprootStore ??= memoryStore();
  } else store = null;
  return store;
}
