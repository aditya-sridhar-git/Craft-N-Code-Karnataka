import { dec, m } from "../fmt";
import type { Generator } from "./types";

export const ATOMIC_MASS: Record<string, number> = {
  H: 1,
  C: 12,
  N: 14,
  O: 16,
  Na: 23,
  Mg: 24,
  Al: 27,
  S: 32,
  Cl: 35.5,
  K: 39,
  Ca: 40,
};

const NAMES: Record<string, string> = {
  H: "hydrogen",
  C: "carbon",
  N: "nitrogen",
  O: "oxygen",
  Na: "sodium",
  Mg: "magnesium",
  Al: "aluminium",
  S: "sulfur",
  Cl: "chlorine",
  K: "potassium",
  Ca: "calcium",
};

interface Part {
  el: string;
  n: number;
  group: number | null;
}

/** Parses simple formulas with one level of brackets: H2O, Ca(OH)2, Al2(SO4)3, (NH4)2SO4, C2H5OH. */
export function parseFormula(formula: string) {
  const parts: Part[] = [];
  const groupMult: number[] = [];
  let group: number | null = null;
  const re = /([A-Z][a-z]?)(\d*)|(\()|\)(\d*)/g;
  let match: RegExpExecArray | null;
  let consumed = 0;
  while ((match = re.exec(formula))) {
    consumed += match[0].length;
    if (match[1]) parts.push({ el: match[1], n: match[2] ? Number(match[2]) : 1, group });
    else if (match[3]) {
      if (group !== null) throw new Error(`Nested brackets not supported: ${formula}`);
      group = groupMult.length;
      groupMult.push(1);
    } else {
      if (group === null) throw new Error(`Unbalanced ) in ${formula}`);
      groupMult[group] = match[4] ? Number(match[4]) : 1;
      group = null;
    }
  }
  if (consumed !== formula.length || group !== null) throw new Error(`Can't parse formula ${formula}`);
  for (const p of parts) if (!(p.el in ATOMIC_MASS)) throw new Error(`Unknown element ${p.el}`);
  return { parts, groupMult };
}

type Mode = "true" | "ignore-subscripts" | "bracket-last-only";

/** Atom counts per element. The non-true modes reproduce common counting mistakes. */
export function atomCounts(formula: string, mode: Mode = "true") {
  const { parts, groupMult } = parseFormula(formula);
  const counts: Record<string, number> = {};
  parts.forEach((p, i) => {
    let n = p.n;
    if (mode === "ignore-subscripts") n = 1;
    else if (p.group !== null) {
      const lastInGroup = i === parts.length - 1 || parts[i + 1].group !== p.group;
      if (mode === "true" || lastInGroup) n *= groupMult[p.group];
    }
    if (mode === "ignore-subscripts") counts[p.el] = 1;
    else counts[p.el] = (counts[p.el] ?? 0) + n;
  });
  return counts;
}

export const totalAtoms = (formula: string, mode: Mode = "true") =>
  Object.values(atomCounts(formula, mode)).reduce((a, b) => a + b, 0);

export const molarMass = (formula: string, mode: Mode = "true") =>
  Math.round(Object.entries(atomCounts(formula, mode)).reduce((s, [el, n]) => s + ATOMIC_MASS[el] * n, 0) * 10) / 10;

/** LaTeX for a formula, with digits as subscripts. */
export const chem = (formula: string, coefficient = 1) =>
  m(`${coefficient > 1 ? coefficient : ""}\\mathrm{${formula.replace(/(\d+)/g, "_{$1}")}}`);

const COUNT_FORMULAS = ["H2SO4", "CaCO3", "Ca(OH)2", "Al2(SO4)3", "C6H12O6", "NH4NO3", "Mg(OH)2", "HNO3", "Na2CO3", "(NH4)2SO4", "C2H5OH"];
const MASS_FORMULAS = ["H2O", "CO2", "NH3", "CH4", "H2SO4", "CaCO3", "Ca(OH)2", "Mg(OH)2", "NaOH", "HNO3", "Na2CO3", "C6H12O6", "Al2(SO4)3", "SO2"];
const MOLE_FORMULAS = ["H2O", "CO2", "NaCl", "CaCO3", "NaOH", "CH4", "NH3", "O2", "N2"];

export const formulas: Generator[] = [
  (rng) => {
    const f = rng.pick(COUNT_FORMULAS);
    const total = totalAtoms(f);
    const elements = Object.keys(atomCounts(f)).length;
    const breakdown = Object.entries(atomCounts(f))
      .map(([el, n]) => `${n} ${NAMES[el]}`)
      .join(", ");
    return {
      skillId: "formulas",
      key: `count-${f}`,
      prompt: `How many atoms are there in one molecule (formula unit) of ${chem(f)}?`,
      correct: m(total),
      distractors: [
        { text: m(elements), misconceptionId: "count-elements" },
        { text: m(totalAtoms(f, "bracket-last-only")), misconceptionId: "subscript-scope" },
      ],
      fillers: [m(total + 1), m(total - 1), m(total + 2)],
      explanation: `Each subscript belongs to the atom (or bracket) just before it, and a bracket's subscript multiplies everything inside. ${chem(f)} has ${breakdown}: ${total} atoms in total, made of ${elements} different elements.`,
    };
  },
  (rng) => {
    const k = rng.int(2, 4);
    const f = rng.pick(["H2O", "NH3", "CH4", "H2SO4", "Ca(OH)2"]);
    const h = atomCounts(f).H;
    return {
      skillId: "formulas",
      key: `coefficient-${k}-${f}`,
      prompt: `How many hydrogen atoms are there in ${chem(f, k)}?`,
      correct: m(k * h),
      distractors: [
        { text: m(h), misconceptionId: "coefficient-subscript" },
        { text: m(k + h), misconceptionId: "coefficient-subscript" },
      ],
      fillers: [m(k), m(k * h + 1)],
      explanation: `The ${k} in front means ${k} separate molecules of ${chem(f)}, each with ${h} hydrogen atom${h > 1 ? "s" : ""}: ${m(`${k} \\times ${h} = ${k * h}`)}.`,
    };
  },
  (rng) => {
    const f = rng.pick(["Ca(OH)2", "Mg(OH)2", "Al2(SO4)3", "(NH4)2SO4"]);
    // Ask about an atom that isn't last inside the bracket, where the "subscript only
    // applies to the last atom" mistake changes the count.
    const { parts } = parseFormula(f);
    const el = parts.find((p, i) => p.group !== null && parts[i + 1]?.group === p.group)!.el;
    const right = atomCounts(f)[el];
    const wrong = atomCounts(f, "bracket-last-only")[el];
    return {
      skillId: "formulas",
      key: `bracket-${f}-${el}`,
      prompt: `How many ${NAMES[el]} atoms are there in one ${chem(f)}?`,
      correct: m(right),
      distractors: [
        { text: m(wrong), misconceptionId: "subscript-scope" },
        { text: m(atomCounts(f, "ignore-subscripts")[el]), misconceptionId: "subscript-scope" },
      ],
      fillers: [m(right + 1), m(right * 2), m(right - 1)],
      explanation: `The subscript after a bracket multiplies every atom inside the bracket. In ${chem(f)} that gives ${right} ${NAMES[el]} atoms.`,
    };
  },
];

export const molarMassGen: Generator[] = [
  (rng) => {
    const f = rng.pick(MASS_FORMULAS);
    const M = molarMass(f);
    const els = Object.keys(atomCounts(f));
    const given = els.map((el) => `${el} = ${ATOMIC_MASS[el]}`).join(", ");
    const work = Object.entries(atomCounts(f))
      .map(([el, n]) => (n > 1 ? `${n} \\times ${ATOMIC_MASS[el]}` : `${ATOMIC_MASS[el]}`))
      .join(" + ");
    return {
      skillId: "molar-mass",
      key: `molar-${f}`,
      prompt: `Using the atomic masses ${given}, what is the molar mass of ${chem(f)}?`,
      correct: `${M} g/mol`,
      distractors: [
        { text: `${molarMass(f, "ignore-subscripts")} g/mol`, misconceptionId: "ignore-subscript" },
        { text: `${molarMass(f, "bracket-last-only")} g/mol`, misconceptionId: "bracket-multiplier" },
      ],
      fillers: [`${dec(M + 16, 1)} g/mol`, `${dec(M * 2, 1)} g/mol`, `${dec(M - 2, 1)} g/mol`],
      explanation: `Add the atomic mass of every atom, using the subscripts: ${m(`${work} = ${M}`)} g/mol.`,
    };
  },
];

const AVOGADRO = 6.022;

function standardForm(x: number, exp: number) {
  let mant = x;
  let e = exp;
  while (mant >= 10) {
    mant /= 10;
    e += 1;
  }
  while (mant < 1) {
    mant *= 10;
    e -= 1;
  }
  return { mant: dec(mant, 4), e };
}

export const moles: Generator[] = [
  (rng) => {
    const f = rng.pick(MOLE_FORMULAS);
    const M = molarMass(f);
    const n = rng.pick([0.5, 2, 3, 4, 5]);
    const mass = dec(n * M, 1);
    return {
      skillId: "moles",
      key: `n-from-m-${f}-${n}`,
      prompt: `How many moles are there in ${mass} g of ${chem(f)}? (Molar mass = ${M} g/mol.)`,
      correct: `${n} mol`,
      distractors: [
        { text: `${dec(n * M * M, 1)} mol`, misconceptionId: "mass-times-molar" },
        { text: `${dec(M / (n * M), 3)} mol`, misconceptionId: "molar-over-mass" },
      ],
      fillers: [`${dec(n * M - M, 1)} mol`, `${dec(n + 1, 1)} mol`],
      explanation: `${m(`n = \\frac{m}{M} = \\frac{${mass}}{${M}} = ${n}`)} mol. The molar mass tells you how many grams one mole weighs, so divide by it.`,
    };
  },
  (rng) => {
    const f = rng.pick(MOLE_FORMULAS);
    const M = molarMass(f);
    const n = rng.pick([0.5, 2, 3, 4]);
    return {
      skillId: "moles",
      key: `m-from-n-${f}-${n}`,
      prompt: `What is the mass of ${n} mol of ${chem(f)}? (Molar mass = ${M} g/mol.)`,
      correct: `${dec(n * M, 1)} g`,
      distractors: [
        { text: `${dec(n / M, 4)} g`, misconceptionId: "molar-over-mass" },
        { text: `${dec(M / n, 2)} g`, misconceptionId: "molar-over-mass" },
      ],
      fillers: [`${dec(M + n, 1)} g`, `${dec(M, 1)} g`],
      explanation: `${m(`m = nM = ${n} \\times ${M} = ${dec(n * M, 1)}`)} g.`,
    };
  },
  (rng) => {
    const n = rng.pick([0.5, 2, 3, 0.25, 4]);
    const right = standardForm(n * AVOGADRO, 23);
    const wrongExp = n * AVOGADRO >= 10 ? 23 : 22;
    const divided = standardForm(n / AVOGADRO, -23);
    return {
      skillId: "moles",
      key: `particles-${n}`,
      prompt: `How many molecules are there in ${n} mol of water? (Use ${m("N_A = 6.022 \\times 10^{23}")} per mole.)`,
      correct: m(`${right.mant} \\times 10^{${right.e}}`),
      distractors: [
        { text: m(`${right.mant} \\times 10^{${wrongExp}}`), misconceptionId: "avogadro-power" },
        { text: m(`${divided.mant} \\times 10^{${divided.e}}`), misconceptionId: "molar-over-mass" },
      ],
      fillers: [m(`${n} \\times 10^{23}`), m(`${right.mant} \\times 10^{${right.e + 2}}`)],
      explanation: `Number of particles = moles × ${m("N_A")}: ${m(`${n} \\times 6.022 \\times 10^{23} = ${dec(n * AVOGADRO, 4)} \\times 10^{23} = ${right.mant} \\times 10^{${right.e}}`)}.`,
    };
  },
];
