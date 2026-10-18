import type { Option, Question } from "@/shared/types";
import type { Rng } from "./rng";

export interface Distractor {
  text: string;
  /** Misconception this wrong answer reveals; null for a plausible careless slip. */
  misconceptionId: string | null;
}

export interface McqSpec {
  skillId: string;
  /** Stable id for this exact question instance (used to avoid repeats). */
  key: string;
  prompt: string;
  correct: string;
  /** Misconception-based distractors first, in priority order. */
  distractors: Distractor[];
  /** Extra careless-slip answers, used only if fewer than 3 distractors survive. */
  fillers?: string[];
  explanation: string;
  source?: Question["source"];
}

/** Thrown when an instance can't produce 4 distinct options; generators retry with new numbers. */
export class DegenerateQuestion extends Error {}

const norm = (s: string) => s.replace(/[\s$]+/g, "").replace(/\\,/g, "").toLowerCase();

export function buildMcq(spec: McqSpec, rng: Rng): Question {
  const seen = new Set([norm(spec.correct)]);
  const wrong: Option[] = [];
  const consider = (text: string, misconceptionId: string | null) => {
    if (wrong.length >= 3) return;
    const k = norm(text);
    if (seen.has(k)) return;
    seen.add(k);
    wrong.push({ text, correct: false, misconceptionId });
  };
  for (const d of spec.distractors) consider(d.text, d.misconceptionId);
  for (const f of spec.fillers ?? []) consider(f, null);
  if (wrong.length < 3) throw new DegenerateQuestion(`${spec.key}: only ${wrong.length} distinct distractors`);
  const options = rng.shuffle([{ text: spec.correct, correct: true, misconceptionId: null }, ...wrong]);
  return {
    id: `${spec.skillId}:${spec.key}`,
    skillId: spec.skillId,
    prompt: spec.prompt,
    options,
    explanation: spec.explanation,
    source: spec.source ?? "generator",
  };
}
