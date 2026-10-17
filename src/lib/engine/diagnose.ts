import { indexGraph, pathUp, type DiagnosticGraph, type GraphIndex } from "./graph";

export type NodeStatus = "untested" | "mastered" | "gap" | "inferred-mastered" | "inferred-gap";

/**
 * split      – binary-search underneath the deepest failure that no confirmed root gap explains yet;
 *              once every failure is explained, quickly check untested sibling branches for a second gap.
 * topdown    – walk down one level at a time, from the skills that failed to their direct prerequisites.
 * exhaustive – baseline: test every skill, no inference.
 */
export type PolicyName = "split" | "topdown" | "exhaustive";
export type DoneReason = "resolved" | "budget" | "target-mastered";

export interface AnswerInput {
  questionId: string;
  correct: boolean;
  /** The student chose "I'm not sure" (counted as not correct). */
  unsure: boolean;
  misconceptionId: string | null;
}

export interface AnswerRecord extends AnswerInput {
  skillId: string;
}

/** Why the engine is asking about a skill, so the UI can explain itself. */
export type Why =
  | { kind: "target" }
  | { kind: "repeat"; tiebreak: boolean }
  /** Searching underneath `of`, which the student found hard; `covers` = other unchecked skills underneath this one. */
  | { kind: "foundation"; of: string; direct: boolean; covers: number }
  /** A root gap already explains `of`; checking another of its foundations for a second gap. */
  | { kind: "branch"; of: string };

export interface DiagnosisState {
  targetId: string;
  policy: PolicyName;
  /** Soft question budget: no new skill is started with fewer than 2 questions left. */
  budget: number;
  status: Record<string, NodeStatus>;
  answers: AnswerRecord[];
  current: string | null;
  why: Why | null;
  done: DoneReason | null;
}

export type Step = { kind: "ask"; skillId: string; why: Why } | { kind: "done"; reason: DoneReason };

export interface RootGap {
  skillId: string;
  confidence: "high" | "medium" | "low";
  correct: number;
  total: number;
  unsure: number;
  /** Misconceptions revealed by the wrong options chosen on this skill, most frequent first. */
  misconceptions: { id: string; count: number }[];
  /** Number of struggling skills (including itself) that this gap can explain. */
  explains: number;
  /** Chain from the root gap up to the target topic. */
  path: string[];
}

export interface DiagnosisResult {
  targetId: string;
  roots: RootGap[];
  status: Record<string, NodeStatus>;
  questionsAsked: number;
  budgetHit: boolean;
  targetMastered: boolean;
}

const isFailed = (s: NodeStatus) => s === "gap" || s === "inferred-gap";
const isKnown = (s: NodeStatus) => s === "mastered" || s === "inferred-mastered";

export const DEFAULT_BUDGET = 20;

/**
 * Per-skill decision: a sequential probability ratio test (Wald, 1945). Each answer adds the log of
 * how much likelier it is if the student knows the skill than if they don't. Assumed answer model:
 * knows → correct 90%, wrong option 10%, "not sure" 2%; doesn't know → "not sure" 40%, otherwise a
 * guess among 4 options (correct 15%, wrong 45%). Decide once the odds pass about 20:1, after 2–4 answers.
 */
export const EVIDENCE = {
  correct: Math.log(0.9 / 0.15),
  wrong: Math.log(0.1 / 0.45),
  unsure: Math.log(0.02 / 0.4),
};
const DECIDE_AT = 3; // log-odds ≈ 20:1
const MIN_PER_SKILL = 2;
const MAX_PER_SKILL = 4;

export function evidence(answers: readonly Pick<AnswerInput, "correct" | "unsure">[]): number {
  return answers.reduce((s, a) => s + (a.correct ? EVIDENCE.correct : a.unsure ? EVIDENCE.unsure : EVIDENCE.wrong), 0);
}

/** "mastered", "gap", or null when another question is needed. */
export function verdict(answers: readonly Pick<AnswerInput, "correct" | "unsure">[]): "mastered" | "gap" | null {
  if (answers.length < MIN_PER_SKILL) return null;
  const e = evidence(answers);
  if (e >= DECIDE_AT) return "mastered";
  if (e <= -DECIDE_AT) return "gap";
  if (answers.length >= MAX_PER_SKILL) return e >= 0 ? "mastered" : "gap";
  return null;
}

export class Diagnoser {
  readonly index: GraphIndex;

  constructor(readonly graph: DiagnosticGraph) {
    this.index = indexGraph(graph);
  }

  init(opts: { policy?: PolicyName; budget?: number } = {}): DiagnosisState {
    return {
      targetId: this.graph.targetId,
      policy: opts.policy ?? "split",
      budget: opts.budget ?? DEFAULT_BUDGET,
      status: Object.fromEntries(this.index.ids.map((id) => [id, "untested" as NodeStatus])),
      answers: [],
      current: null,
      why: null,
      done: null,
    };
  }

  /** Decides what to ask next, or finishes. */
  next(state: DiagnosisState): { state: DiagnosisState; step: Step } {
    if (state.done) return { state, step: { kind: "done", reason: state.done } };
    if (state.current && state.why) return { state, step: { kind: "ask", skillId: state.current, why: state.why } };

    const finish = (reason: DoneReason) => {
      const s = { ...state, done: reason };
      return { state: s, step: { kind: "done", reason } as Step };
    };
    const ask = (skillId: string, why: Why) => {
      const s = { ...state, current: skillId, why };
      return { state: s, step: { kind: "ask", skillId, why } as Step };
    };

    const { targetId, status, policy } = state;
    if (status[targetId] === "untested") return ask(targetId, { kind: "target" });
    if (policy !== "exhaustive" && status[targetId] === "mastered") return finish("target-mastered");
    if (state.answers.length + 2 > state.budget) return finish("budget");

    const pick = this.choose(state);
    return pick ? ask(pick.id, pick.why) : finish("resolved");
  }

  /** Records an answer for the skill currently being tested. */
  record(state: DiagnosisState, answer: AnswerInput): DiagnosisState {
    const id = state.current;
    if (!id) throw new Error("No skill is being tested");
    const answers = [...state.answers, { ...answer, skillId: id }];
    const mine = answers.filter((a) => a.skillId === id);
    const decided = verdict(mine);

    if (!decided) return { ...state, answers, why: { kind: "repeat", tiebreak: mine.length >= MIN_PER_SKILL } };
    return this.decide({ ...state, answers }, id, decided);
  }

  /**
   * Decides the current skill from the evidence so far. Used when no more questions are
   * available for it. Returns null if nothing has been answered on it yet.
   */
  settle(state: DiagnosisState): DiagnosisState | null {
    const id = state.current;
    if (!id) return state;
    const mine = state.answers.filter((a) => a.skillId === id);
    if (!mine.length) return null;
    return this.decide(state, id, evidence(mine) >= 0 ? "mastered" : "gap");
  }

  private decide(state: DiagnosisState, id: string, decided: "mastered" | "gap"): DiagnosisState {
    const status = { ...state.status, [id]: decided };
    if (state.policy !== "exhaustive") {
      if (decided === "mastered") {
        for (const p of this.index.below[id]) if (status[p] === "untested") status[p] = "inferred-mastered";
      } else {
        for (const d of this.index.above[id]) if (status[d] === "untested") status[d] = "inferred-gap";
      }
    }
    return { ...state, status, current: null, why: null };
  }

  /** Untested skills underneath any skill that failed (or is affected by a failure). */
  unresolved(status: Record<string, NodeStatus>): Set<string> {
    const region = new Set<string>();
    for (const id of this.index.ids) {
      if (!isFailed(status[id])) continue;
      for (const p of this.index.below[id]) if (status[p] === "untested") region.add(p);
    }
    return region;
  }

  /** Untested direct prerequisites of skills that failed or are affected by a failure. */
  private frontier(status: Record<string, NodeStatus>): string[] {
    const out = new Set<string>();
    for (const id of this.index.ids) {
      if (!isFailed(status[id])) continue;
      for (const p of this.index.prereqs[id]) if (status[p] === "untested") out.add(p);
    }
    return [...out];
  }

  private choose(state: DiagnosisState): { id: string; why: Why } | null {
    const { status, policy } = state;
    const { below, above, depth, prereqs } = this.index;
    const byDepthThenId = (a: string, b: string) => depth[a] - depth[b] || a.localeCompare(b);
    const untestedBelow = (id: string) => [...below[id]].filter((x) => status[x] === "untested");

    if (policy === "exhaustive") {
      const left = this.index.ids.filter((id) => status[id] === "untested").sort(byDepthThenId);
      if (!left.length) return null;
      return { id: left[0], why: this.explain(left[0], status, untestedBelow(left[0]).length) };
    }

    if (policy === "topdown") {
      const frontier = this.frontier(status);
      if (!frontier.length) return null;
      const set = new Set(frontier);
      // Prefer the skill whose failure would settle the most other frontier skills; then bigger subtrees.
      const score = (id: string) => [...above[id]].filter((x) => set.has(x)).length * 1000 + below[id].size;
      frontier.sort((a, b) => score(b) - score(a) || byDepthThenId(a, b));
      return { id: frontier[0], why: this.explain(frontier[0], status, untestedBelow(frontier[0]).length) };
    }

    // split: find a root for the deepest failure that no confirmed root explains yet.
    const gaps = this.index.ids.filter((id) => status[id] === "gap");
    const roots = gaps.filter((g) => prereqs[g].every((p) => isKnown(status[p])));
    const unexplained = gaps.filter((g) => !roots.some((r) => r === g || below[g].has(r)));
    const focus = unexplained
      .map((g) => ({ g, suspects: untestedBelow(g) }))
      .filter((f) => f.suspects.length > 0)
      .sort((a, b) => a.suspects.length - b.suspects.length || depth[b.g] - depth[a.g])[0];

    if (focus) {
      // Binary search: the root is `focus.g` itself or one of the untested skills underneath it.
      const S = focus.suspects.length + 1;
      const within = new Set(focus.suspects);
      const sizeIfFail = (c: string) => 1 + [...below[c]].filter((x) => within.has(x)).length;
      const expected = (c: string) => {
        const a = sizeIfFail(c);
        const p = a / S; // uniform prior over the suspects
        return p * a + (1 - p) * (S - a);
      };
      const pick = [...focus.suspects].sort((a, b) => expected(a) - expected(b) || byDepthThenId(a, b))[0];
      return {
        id: pick,
        why: { kind: "foundation", of: focus.g, direct: prereqs[focus.g].includes(pick), covers: sizeIfFail(pick) - 1 },
      };
    }

    // Every failure is explained. Check any untested sibling branch for a second, hidden gap.
    const frontier = this.frontier(status);
    if (!frontier.length) return null;
    frontier.sort((a, b) => untestedBelow(b).length - untestedBelow(a).length || byDepthThenId(a, b));
    const id = frontier[0];
    const parent = this.index.ids.find((f) => isFailed(status[f]) && prereqs[f].includes(id)) ?? this.graph.targetId;
    return { id, why: { kind: "branch", of: parent } };
  }

  private explain(id: string, status: Record<string, NodeStatus>, covers: number): Why {
    const { prereqs, above, depth } = this.index;
    const failedAbove = [...above[id]].filter((f) => isFailed(status[f]));
    const direct = failedAbove.find((f) => prereqs[f].includes(id) && status[f] === "gap") ?? failedAbove.find((f) => prereqs[f].includes(id));
    if (direct) return { kind: "foundation", of: direct, direct: true, covers };
    const nearest = failedAbove.sort((a, b) => depth[b] - depth[a])[0] ?? this.graph.targetId;
    return { kind: "foundation", of: nearest, direct: false, covers };
  }

  summarize(state: DiagnosisState): DiagnosisResult {
    const { status, answers, targetId } = state;
    const { prereqs, above } = this.index;
    const roots: RootGap[] = [];
    for (const id of this.index.ids) {
      if (status[id] !== "gap") continue;
      const ps = prereqs[id];
      if (ps.some((p) => isFailed(status[p]))) continue;
      const unresolved = ps.some((p) => status[p] === "untested");
      const mine = answers.filter((a) => a.skillId === id);
      const correct = mine.filter((a) => a.correct).length;
      const tally: Record<string, number> = {};
      for (const a of mine) if (!a.correct && a.misconceptionId) tally[a.misconceptionId] = (tally[a.misconceptionId] ?? 0) + 1;
      roots.push({
        skillId: id,
        confidence: unresolved ? "low" : correct === 0 ? "high" : "medium",
        correct,
        total: mine.length,
        unsure: mine.filter((a) => a.unsure).length,
        misconceptions: Object.entries(tally)
          .map(([mid, c]) => ({ id: mid, count: c }))
          .sort((a, b) => b.count - a.count),
        explains: 1 + [...above[id]].filter((d) => isFailed(status[d])).length,
        path: pathUp(this.index, id, targetId),
      });
    }
    const rank = { high: 0, medium: 1, low: 2 };
    roots.sort((a, b) => b.explains - a.explains || rank[a.confidence] - rank[b.confidence]);
    return {
      targetId,
      roots,
      status,
      questionsAsked: answers.length,
      budgetHit: state.done === "budget",
      targetMastered: isKnown(status[targetId]),
    };
  }
}
