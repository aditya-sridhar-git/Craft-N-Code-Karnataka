import { z } from "zod";

/*
 * Classes: a signed-in teacher makes a class and shares its join code. A student who enters the
 * code sends each finished check-up's outcome to the class. No name or identifier is ever sent,
 * only what a teacher needs to decide what to re-teach.
 */

/** Join codes avoid characters that are easy to misread (0/O, 1/I/L). */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
const CodeSchema = z.string().regex(new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`));

/** What a student types ("k7q-3mx") into the stored form ("K7Q3MX"): letters and digits only, upper case. */
export const normaliseCode = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Results are kept for this long, then deleted automatically. */
export const RETENTION_DAYS = 90;

export const ClassResult = z.object({
  topicTitle: z.string().trim().min(1).max(120),
  subject: z.enum(["maths", "physics", "chemistry", "other"]),
  grade: z.number().int().min(6).max(12),
  /** The main root gap, or null when no gap was found. */
  rootSkillId: z.string().max(80).nullable(),
  rootTitle: z.string().max(120).nullable(),
  /** The student-facing label of the misconception detected on the root gap, if any. */
  misconception: z.string().max(200).nullable(),
  confidence: z.enum(["high", "medium", "low"]).nullable(),
  noGap: z.boolean(),
  questions: z.number().int().min(0).max(100),
});
export type ClassResult = z.infer<typeof ClassResult>;

export const CreateClassRequest = z.object({ name: z.string().trim().min(2).max(60) });
export const ClassCodeRequest = z.object({ code: CodeSchema });
export const SubmitResultRequest = z.object({ code: CodeSchema, result: ClassResult });

/** Teacher accounts. Students never have accounts. */
export const MIN_PASSWORD = 8;
const Email = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const SignUpRequest = z.object({
  name: z.string().trim().min(2).max(80),
  email: Email,
  password: z.string().min(MIN_PASSWORD).max(200),
});
export const SignInRequest = z.object({ email: Email, password: z.string().min(1).max(200) });

export interface TeacherProfile {
  name: string;
  email: string;
}

export interface TeacherClass {
  code: string;
  name: string;
  createdAt: string;
  results: number;
}

export interface StoredResult extends ClassResult {
  id: string;
  createdAt: string;
}

export interface ClassView {
  code: string;
  name: string;
  createdAt: string;
  results: StoredResult[];
}

export interface GapSummary {
  rootTitle: string;
  count: number;
  /** Most common misconceptions behind this gap, most frequent first. */
  misconceptions: { label: string; count: number }[];
  /** The chapters students were stuck on when this gap turned up. */
  topics: string[];
}

/** Groups a class's results by root gap, most common first: the "what to re-teach" list. */
export function summariseGaps(results: readonly StoredResult[]): GapSummary[] {
  const groups = new Map<string, { count: number; mis: Map<string, number>; topics: Set<string> }>();
  for (const r of results) {
    if (r.noGap || !r.rootTitle) continue;
    const g = groups.get(r.rootTitle) ?? { count: 0, mis: new Map(), topics: new Set() };
    g.count++;
    g.topics.add(r.topicTitle);
    if (r.misconception) g.mis.set(r.misconception, (g.mis.get(r.misconception) ?? 0) + 1);
    groups.set(r.rootTitle, g);
  }
  return [...groups]
    .map(([rootTitle, g]) => ({
      rootTitle,
      count: g.count,
      misconceptions: [...g.mis].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
      topics: [...g.topics],
    }))
    .sort((a, b) => b.count - a.count || a.rootTitle.localeCompare(b.rootTitle));
}
