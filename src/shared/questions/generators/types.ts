import type { McqSpec } from "../mcq";
import type { Rng } from "../rng";

/** A question template: picks random numbers and returns a fully specified MCQ. */
export type Generator = (rng: Rng) => McqSpec;
