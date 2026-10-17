import { BANK, type BankItem } from "@/data/bank";
import type { Question } from "@/lib/types";
import * as algebra from "./generators/algebra";
import * as chemistry from "./generators/chemistry";
import * as geometry from "./generators/geometry";
import * as number from "./generators/number";
import * as physics from "./generators/physics";
import type { Generator } from "./generators/types";
import { buildMcq, DegenerateQuestion } from "./mcq";
import type { Rng } from "./rng";

export const GENERATORS: Record<string, Generator[]> = {
  integers: number.integers,
  bodmas: number.bodmas,
  fractions: number.fractions,
  "fraction-ops": number.fractionOps,
  decimals: number.decimals,
  ratio: number.ratio,
  "direct-inverse": number.directInverse,
  exponents: number.exponents,
  "sci-notation": number.sciNotation,
  expressions: algebra.expressions,
  "linear-equations": algebra.linearEquations,
  rearranging: algebra.rearranging,
  identities: algebra.identities,
  factorisation: algebra.factorisation,
  "square-roots": algebra.squareRoots,
  quadratics: algebra.quadratics,
  pythagoras: geometry.pythagoras,
  "trig-ratios": geometry.trigRatios,
  "standard-angles": geometry.standardAngles,
  "heights-distances": geometry.heightsDistances,
  units: physics.units,
  velocity: physics.velocity,
  acceleration: physics.acceleration,
  "motion-equations": physics.motionEquations,
  vectors: physics.vectors,
  components: physics.components,
  projectile: physics.projectile,
  current: physics.current,
  voltage: physics.voltage,
  "ohms-law": physics.ohmsLaw,
  circuits: physics.circuits,
  formulas: chemistry.formulas,
  "molar-mass": chemistry.molarMassGen,
  moles: chemistry.moles,
};

const BANK_BY_SKILL: Record<string, BankItem[]> = {};
for (const item of BANK) (BANK_BY_SKILL[item.skillId] ??= []).push(item);

export const bankItemsFor = (skillId: string) => BANK_BY_SKILL[skillId] ?? [];

export function bankQuestion(item: BankItem, rng: Rng): Question {
  return buildMcq(
    {
      skillId: item.skillId,
      key: `bank-${item.id}`,
      prompt: item.prompt,
      correct: item.correct,
      distractors: item.distractors,
      explanation: item.explanation,
      source: "bank",
    },
    rng,
  );
}

/** True when Taproot has its own (curated, verified) questions for this skill. */
export const hasCuratedQuestions = (skillId: string) => Boolean(GENERATORS[skillId]?.length || BANK_BY_SKILL[skillId]?.length);

/**
 * Draws a fresh question for a curated skill, mixing generated and hand-written ones
 * and skipping question ids already used in this session. Returns null if none are left.
 */
export function drawQuestion(skillId: string, rng: Rng, used: ReadonlySet<string> = new Set()): Question | null {
  const gens = GENERATORS[skillId] ?? [];
  const bank = bankItemsFor(skillId).filter((b) => !used.has(`${skillId}:bank-${b.id}`));
  for (let attempt = 0; attempt < 60; attempt++) {
    const useBank = bank.length > 0 && (gens.length === 0 || rng.chance(bank.length / (bank.length + gens.length * 2)));
    if (useBank) return bankQuestion(rng.pick(bank), rng);
    if (!gens.length) break;
    try {
      const spec = rng.pick(gens)(rng);
      if (used.has(`${spec.skillId}:${spec.key}`)) continue;
      return buildMcq(spec, rng);
    } catch (e) {
      if (e instanceof DegenerateQuestion) continue;
      throw e;
    }
  }
  return null;
}
