import { describe, expect, it } from "vitest";
import { SKILLS } from "@/shared/data/skills";
import { FEATURED } from "@/shared/data/topics";
import { DEFAULT_BUDGET, Diagnoser, verdict, type PolicyName } from "@/shared/engine/diagnose";
import { buildSubgraph } from "@/shared/engine/graph";
import { runDiagnosis } from "@/shared/engine/simulate";
import { createRng } from "@/shared/questions/rng";

/** Knows every skill not affected by `gaps`; says "I'm not sure" to everything else. No noise. */
const exact = (...gaps: string[]) => ({ gaps: new Set(gaps), slip: 0, unsure: 1 });
const diagnoserFor = (targetId: string) => new Diagnoser(buildSubgraph(targetId, (id) => SKILLS[id]));
const POLICIES: PolicyName[] = ["split", "topdown", "exhaustive"];

describe("single root gap, noise-free student", () => {
  for (const topic of FEATURED) {
    const d = diagnoserFor(topic.targetId);
    for (const policy of POLICIES) {
      it(`${topic.id} / ${policy}: finds the gap wherever it is`, () => {
        for (const gap of d.index.ids) {
          const result = runDiagnosis(d, exact(gap), createRng(1), { policy, budget: 500 });
          expect(result.roots.map((r) => r.skillId), `gap at ${gap}`).toEqual([gap]);
          expect(result.roots[0].confidence, `gap at ${gap}`).toBe("high");
          expect(result.roots[0].path.at(-1)).toBe(topic.targetId);
          expect(result.roots[0].path[0]).toBe(gap);
        }
      });
    }

    it(`${topic.id} / split: finds any single gap within the default ${DEFAULT_BUDGET}-question budget`, () => {
      for (const gap of d.index.ids) {
        const result = runDiagnosis(d, exact(gap), createRng(1), { policy: "split" });
        expect(result.budgetHit, `gap at ${gap}`).toBe(false);
        expect(result.roots.map((r) => r.skillId), `gap at ${gap}`).toEqual([gap]);
        expect(result.questionsAsked).toBeLessThanOrEqual(DEFAULT_BUDGET);
      }
    });

    it(`${topic.id}: stops after the target check when there is no gap`, () => {
      const result = runDiagnosis(d, exact(), createRng(1), { policy: "split" });
      expect(result.targetMastered).toBe(true);
      expect(result.roots).toEqual([]);
      expect(result.questionsAsked).toBe(2);
    });
  }
});

describe("several gaps", () => {
  const d = diagnoserFor("projectile");

  it("finds two independent root gaps", () => {
    const result = runDiagnosis(d, exact("trig-ratios", "rearranging"), createRng(1), { policy: "split", budget: 500 });
    expect(result.roots.map((r) => r.skillId).sort()).toEqual(["rearranging", "trig-ratios"]);
  });

  it("reports only the deeper gap when one gap sits underneath another", () => {
    const result = runDiagnosis(d, exact("trig-ratios", "pythagoras"), createRng(1), { policy: "split", budget: 500 });
    expect(result.roots.map((r) => r.skillId)).toEqual(["pythagoras"]);
  });

  it("finds the gap in the target itself when every foundation is fine", () => {
    const result = runDiagnosis(d, exact("projectile"), createRng(1), { policy: "split" });
    expect(result.roots.map((r) => r.skillId)).toEqual(["projectile"]);
  });
});

describe("engine mechanics", () => {
  const d = diagnoserFor("quadratics");

  it("asks about the target first, then explains each new skill", () => {
    let state = d.init();
    const first = d.next(state);
    expect(first.step).toEqual({ kind: "ask", skillId: "quadratics", why: { kind: "target" } });
    state = d.record(first.state, { questionId: "q1", correct: false, unsure: true, misconceptionId: null });
    const second = d.next(state);
    expect(second.step).toMatchObject({ kind: "ask", skillId: "quadratics", why: { kind: "repeat" } });
    state = d.record(second.state, { questionId: "q2", correct: false, unsure: false, misconceptionId: "root-sign" });
    expect(state.status.quadratics).toBe("gap");
    const third = d.next(state);
    expect(third.step.kind).toBe("ask");
    if (third.step.kind === "ask") {
      expect(third.step.why.kind).toBe("foundation");
      expect(third.step.skillId).not.toBe("quadratics");
    }
  });

  it("keeps asking after mixed answers until the evidence is clear", () => {
    let state = d.next(d.init()).state;
    state = d.record(state, { questionId: "a", correct: true, unsure: false, misconceptionId: null });
    state = d.record(state, { questionId: "b", correct: false, unsure: false, misconceptionId: null });
    expect(state.current).toBe("quadratics");
    expect(state.why).toEqual({ kind: "repeat", tiebreak: true });
    state = d.record(state, { questionId: "c", correct: true, unsure: false, misconceptionId: null });
    expect(state.current).toBe("quadratics");
    state = d.record(state, { questionId: "d", correct: true, unsure: false, misconceptionId: null });
    expect(state.status.quadratics).toBe("mastered");
  });

  it("decides each skill with a sequential evidence test", () => {
    const C = { correct: true, unsure: false };
    const W = { correct: false, unsure: false };
    const U = { correct: false, unsure: true };
    expect(verdict([C])).toBeNull(); // never decides on one answer
    expect(verdict([C, C])).toBe("mastered");
    expect(verdict([W, W])).toBe("gap");
    expect(verdict([U, W])).toBe("gap");
    expect(verdict([C, U])).toBeNull();
    expect(verdict([C, W, C])).toBeNull();
    expect(verdict([C, W, W, W])).toBe("gap"); // stops at 4 and goes with the evidence
    expect(verdict([C, U, C, C])).toBe("mastered");
  });

  it("infers everything underneath a skill the student has mastered", () => {
    let state = d.next(d.init()).state;
    state = d.record(state, { questionId: "a", correct: false, unsure: true, misconceptionId: null });
    state = d.record(state, { questionId: "b", correct: false, unsure: true, misconceptionId: null });
    state = { ...state, current: "factorisation", why: { kind: "foundation", of: "quadratics", direct: true, covers: 0 } };
    state = d.record(state, { questionId: "c", correct: true, unsure: false, misconceptionId: null });
    state = d.record(state, { questionId: "d", correct: true, unsure: false, misconceptionId: null });
    for (const id of d.index.below.factorisation) expect(state.status[id], id).toBe("inferred-mastered");
  });

  it("tallies misconceptions from the wrong options chosen on the root gap", () => {
    let state = d.next(d.init()).state;
    state = d.record(state, { questionId: "a", correct: false, unsure: false, misconceptionId: "root-sign" });
    state = d.record(state, { questionId: "b", correct: false, unsure: false, misconceptionId: "root-sign" });
    // Every foundation is fine:
    for (;;) {
      const { state: s, step } = d.next(state);
      state = s;
      if (step.kind === "done") break;
      state = d.record(state, { questionId: `${step.skillId}-${state.answers.length}`, correct: true, unsure: false, misconceptionId: null });
    }
    const result = d.summarize(state);
    expect(result.roots).toHaveLength(1);
    expect(result.roots[0].skillId).toBe("quadratics");
    expect(result.roots[0].misconceptions).toEqual([{ id: "root-sign", count: 2 }]);
  });

  it("stops at the budget and flags unresolved gaps as low confidence", () => {
    const deep = diagnoserFor("projectile");
    const result = runDiagnosis(deep, exact("fractions"), createRng(1), { policy: "topdown", budget: 6 });
    expect(result.budgetHit).toBe(true);
    expect(result.questionsAsked).toBeLessThanOrEqual(7);
    for (const r of result.roots) expect(r.confidence).toBe("low");
  });
});
