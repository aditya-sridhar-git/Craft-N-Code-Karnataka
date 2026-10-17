export type Subject = "maths" | "physics" | "chemistry" | "other";

export interface Misconception {
  id: string;
  /** Short description shown to the student, e.g. "Swaps sine and cosine". */
  label: string;
  /** Curated fix: a short explanation that addresses this exact misconception. */
  fix: string;
}

export interface SyllabusRef {
  cls: number;
  topic: string;
}

export interface Skill {
  id: string;
  title: string;
  /** Short label for tree nodes. */
  short: string;
  subject: Subject;
  /** Class (grade) in which this is usually taught. */
  grade: number;
  /** One plain-language sentence. */
  summary: string;
  /** Skills that must be understood first. */
  prereqs: string[];
  misconceptions: Misconception[];
  ref: SyllabusRef | null;
  /** Curated micro-lesson used when AI is unavailable (supports $math$). */
  lesson: string;
  /** True when the node was created by AI for a custom topic. */
  generated?: boolean;
}

export interface Option {
  text: string;
  correct: boolean;
  /** Misconception this wrong option reveals, or null for a careless slip. */
  misconceptionId: string | null;
}

export interface Question {
  id: string;
  skillId: string;
  prompt: string;
  options: Option[];
  /** Worked solution, shown after the check-up and in practice. */
  explanation: string;
  source: "generator" | "bank" | "ai";
}

export interface FeaturedTopic {
  id: string;
  title: string;
  subject: Subject;
  grade: number;
  targetId: string;
  blurb: string;
  /** A typical problem students get stuck on, used as a starter in the paste-a-problem box. */
  sampleProblem: string;
}
