import type { Rng } from "@/shared/questions/rng";
import { Diagnoser, type DiagnosisResult, type PolicyName } from "./diagnose";
import type { GraphIndex } from "./graph";

/**
 * A simulated student for evaluation (a DINA-style model): a skill is known only if it is not
 * a gap itself and none of its prerequisites are gaps. Answers are noisy: known skills are
 * slipped with probability `slip`; unknown skills get "I'm not sure" with probability `unsure`,
 * otherwise a random guess among four options.
 */
export interface SimStudent {
  gaps: ReadonlySet<string>;
  slip: number;
  unsure: number;
  options?: number;
}

export const knows = (index: GraphIndex, gaps: ReadonlySet<string>, id: string) =>
  !gaps.has(id) && ![...index.below[id]].some((b) => gaps.has(b));

/** The true root gaps: gaps whose own prerequisites are all known. */
export function trueRoots(index: GraphIndex, gaps: ReadonlySet<string>): Set<string> {
  return new Set([...gaps].filter((g) => ![...index.below[g]].some((b) => gaps.has(b))));
}

export function runDiagnosis(
  diagnoser: Diagnoser,
  student: SimStudent,
  rng: Rng,
  opts: { policy: PolicyName; budget?: number },
): DiagnosisResult {
  const options = student.options ?? 4;
  let state = diagnoser.init(opts);
  for (let guard = 0; guard < 500; guard++) {
    const { state: s, step } = diagnoser.next(state);
    state = s;
    if (step.kind === "done") break;
    const known = knows(diagnoser.index, student.gaps, step.skillId);
    let correct: boolean;
    let unsure = false;
    if (known) correct = !rng.chance(student.slip);
    else if (rng.chance(student.unsure)) {
      correct = false;
      unsure = true;
    } else correct = rng.chance(1 / options);
    state = diagnoser.record(state, { questionId: `sim-${guard}`, correct, unsure, misconceptionId: null });
  }
  return diagnoser.summarize(state);
}
