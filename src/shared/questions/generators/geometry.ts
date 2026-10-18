import { m } from "../fmt";
import type { Generator } from "./types";

const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25],
  [12, 16, 20],
] as const;

/** Primitive triples, so side ratios are already in lowest terms. */
const PRIMITIVE = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
] as const;

const fr = (a: number, b: number) => m(`\\frac{${a}}{${b}}`);

export const pythagoras: Generator[] = [
  (rng) => {
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      skillId: "pythagoras",
      key: `hyp-${a}-${b}`,
      prompt: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. How long is the hypotenuse?`,
      correct: `${c} cm`,
      distractors: [{ text: `${a + b} cm`, misconceptionId: "no-square" }],
      fillers: [`${a * a + b * b} cm`, `${c + 2} cm`, `${b - a + 1} cm`],
      explanation: `${m(`c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}`)}, so ${m(`c = \\sqrt{${c * c}} = ${c}`)} cm.`,
    };
  },
  (rng) => {
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      skillId: "pythagoras",
      key: `leg-${a}-${c}`,
      prompt: `A right-angled triangle has hypotenuse ${c} cm and one other side ${a} cm. How long is the third side?`,
      correct: `${b} cm`,
      distractors: [
        { text: `${m(`\\sqrt{${c * c + a * a}}`)} cm`, misconceptionId: "add-when-leg" },
        { text: `${c - a} cm`, misconceptionId: "no-square" },
      ],
      fillers: [`${c + a} cm`, `${b + 1} cm`],
      explanation: `The hypotenuse is the longest side, so to find a shorter side you subtract: ${m(`b^2 = ${c}^2 - ${a}^2 = ${c * c} - ${a * a} = ${b * b}`)}, so ${m(`b = ${b}`)} cm.`,
    };
  },
  (rng) => {
    const [p, q, r] = rng.pick([
      ["P", "Q", "R"],
      ["A", "B", "C"],
      ["X", "Y", "Z"],
      ["L", "M", "N"],
    ] as const);
    return {
      skillId: "pythagoras",
      key: `which-hyp-${p}${q}${r}`,
      prompt: `In triangle ${p}${q}${r}, the right angle is at ${q}. Which side is the hypotenuse?`,
      correct: `${p}${r}`,
      distractors: [
        { text: `${p}${q}`, misconceptionId: "hypotenuse-id" },
        { text: `${q}${r}`, misconceptionId: "hypotenuse-id" },
      ],
      fillers: ["It depends on the side lengths"],
      explanation: `The hypotenuse is the side opposite the right angle, the one that doesn't touch ${q}: ${p}${r}. It is always the longest side.`,
    };
  },
  (rng) => {
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      skillId: "pythagoras",
      key: `is-right-${a}-${b}-${c}`,
      prompt: `A triangle has sides ${a} cm, ${b} cm and ${c} cm. Is it right-angled?`,
      correct: `Yes, because ${m(`${a}^2 + ${b}^2 = ${c}^2`)}`,
      distractors: [{ text: `No, because ${m(`${a} + ${b} \\ne ${c}`)}`, misconceptionId: "no-square" }],
      fillers: ["No, only a 3, 4, 5 triangle is right-angled", "You can't tell without measuring the angles"],
      explanation: `Check Pythagoras: ${m(`${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c} = ${c}^2`)}. Because it holds, the angle opposite the ${c} cm side is ${m("90^\\circ")}.`,
    };
  },
];

type Fn = "sin" | "cos" | "tan";

function triangle(rng: Parameters<Generator>[0]) {
  const [x, y, hyp] = rng.pick(PRIMITIVE);
  const flip = rng.chance(0.5);
  const opp = flip ? x : y;
  const adj = flip ? y : x;
  const given = `In triangle ABC, ${m("\\angle B = 90^\\circ")}, ${m(`AB = ${adj}`)}, ${m(`BC = ${opp}`)} and ${m(`AC = ${hyp}`)}.`;
  const sides = `For angle A, the opposite side is BC = ${opp}, the adjacent side is AB = ${adj}, and the hypotenuse is AC = ${hyp}.`;
  return { opp, adj, hyp, given, sides };
}

function ratioQuestion(fn: Fn): Generator {
  return (rng) => {
    const { opp, adj, hyp, given, sides } = triangle(rng);
    const spec = {
      sin: {
        correct: fr(opp, hyp),
        distractors: [
          { text: fr(adj, hyp), misconceptionId: "sin-cos-swap" },
          { text: fr(hyp, opp), misconceptionId: "ratio-inverted" },
          { text: fr(opp, adj), misconceptionId: "wrong-ratio" },
        ],
        rule: `\\sin A = \\frac{\\text{opposite}}{\\text{hypotenuse}} = \\frac{${opp}}{${hyp}}`,
      },
      cos: {
        correct: fr(adj, hyp),
        distractors: [
          { text: fr(opp, hyp), misconceptionId: "sin-cos-swap" },
          { text: fr(hyp, adj), misconceptionId: "ratio-inverted" },
          { text: fr(adj, opp), misconceptionId: "wrong-ratio" },
        ],
        rule: `\\cos A = \\frac{\\text{adjacent}}{\\text{hypotenuse}} = \\frac{${adj}}{${hyp}}`,
      },
      tan: {
        correct: fr(opp, adj),
        distractors: [
          { text: fr(opp, hyp), misconceptionId: "wrong-ratio" },
          { text: fr(adj, opp), misconceptionId: "ratio-inverted" },
          { text: fr(adj, hyp), misconceptionId: "wrong-ratio" },
        ],
        rule: `\\tan A = \\frac{\\text{opposite}}{\\text{adjacent}} = \\frac{${opp}}{${adj}}`,
      },
    }[fn];
    return {
      skillId: "trig-ratios",
      key: `${fn}-${opp}-${adj}`,
      prompt: `${given} What is ${m(`\\${fn} A`)}?`,
      correct: spec.correct,
      distractors: spec.distractors,
      fillers: [fr(hyp, adj)],
      explanation: `${sides} So ${m(spec.rule)}.`,
    };
  };
}

export const trigRatios: Generator[] = [
  ratioQuestion("sin"),
  ratioQuestion("cos"),
  ratioQuestion("tan"),
  (rng) => {
    const [x, y, hyp] = rng.pick(PRIMITIVE);
    const flip = rng.chance(0.5);
    const opp = flip ? x : y;
    const adj = flip ? y : x;
    return {
      skillId: "trig-ratios",
      key: `sin-to-cos-${opp}-${hyp}`,
      prompt: `${m("\\theta")} is an acute angle with ${m(`\\sin\\theta = \\frac{${opp}}{${hyp}}`)}. What is ${m("\\cos\\theta")}?`,
      correct: fr(adj, hyp),
      distractors: [
        { text: fr(opp, hyp), misconceptionId: "sin-cos-swap" },
        { text: fr(hyp, adj), misconceptionId: "ratio-inverted" },
        { text: fr(opp, adj), misconceptionId: "wrong-ratio" },
      ],
      fillers: [fr(hyp - opp, hyp)],
      explanation: `Draw a right triangle with opposite side ${opp} and hypotenuse ${hyp}. By Pythagoras the adjacent side is ${m(`\\sqrt{${hyp}^2 - ${opp}^2} = ${adj}`)}, so ${m(`\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}} = \\frac{${adj}}{${hyp}}`)}.`,
    };
  },
];

const VALUES: Record<Fn, Record<30 | 45 | 60, string>> = {
  sin: { 30: "\\frac{1}{2}", 45: "\\frac{1}{\\sqrt{2}}", 60: "\\frac{\\sqrt{3}}{2}" },
  cos: { 30: "\\frac{\\sqrt{3}}{2}", 45: "\\frac{1}{\\sqrt{2}}", 60: "\\frac{1}{2}" },
  tan: { 30: "\\frac{1}{\\sqrt{3}}", 45: "1", 60: "\\sqrt{3}" },
};

const DOUBLED: Record<Fn, Record<30 | 60, string>> = {
  sin: { 30: "\\frac{\\sqrt{3}}{4}", 60: "1" },
  cos: { 30: "\\frac{1}{4}", 60: "\\sqrt{3}" },
  tan: { 30: "\\frac{\\sqrt{3}}{2}", 60: "\\frac{2}{\\sqrt{3}}" },
};

function specialTriangle(angle: 30 | 45 | 60) {
  return angle === 45
    ? `Use the ${m("45^\\circ")}–${m("45^\\circ")}–${m("90^\\circ")} triangle with sides ${m("1, 1, \\sqrt{2}")}.`
    : `Use the ${m("30^\\circ")}–${m("60^\\circ")}–${m("90^\\circ")} triangle with sides ${m("1, \\sqrt{3}, 2")}: the side opposite ${m("30^\\circ")} is 1, the side opposite ${m("60^\\circ")} is ${m("\\sqrt{3}")}, and the hypotenuse is 2.`;
}

export const standardAngles: Generator[] = [
  (rng) => {
    const fn = rng.pick(["sin", "cos", "tan"] as const);
    const angle = fn === "tan" ? rng.pick([30, 45, 60] as const) : rng.pick([30, 60] as const);
    const other: Fn = fn === "sin" ? "cos" : fn === "cos" ? "sin" : "tan";
    const comp = (90 - angle) as 30 | 45 | 60;
    const distractors =
      fn === "tan"
        ? [{ text: m(VALUES.tan[comp]), misconceptionId: "tan60-inverted" }]
        : [
            { text: m(VALUES[other][angle]), misconceptionId: "sin30-cos30-swap" },
            { text: m(VALUES[fn][comp]), misconceptionId: "sin30-cos30-swap" },
          ];
    if (angle !== 45) {
      distractors.push({ text: m(DOUBLED[fn][angle as 30 | 60]), misconceptionId: "linear-angles" });
    }
    return {
      skillId: "standard-angles",
      key: `${fn}-${angle}`,
      prompt: `What is the exact value of ${m(`\\${fn} ${angle}^\\circ`)}?`,
      correct: m(VALUES[fn][angle]),
      distractors,
      fillers: [m("\\sqrt{2}"), m("\\frac{1}{3}"), m("0"), m("2")],
      explanation: `${specialTriangle(angle)} So ${m(`\\${fn} ${angle}^\\circ = ${VALUES[fn][angle]}`)}.`,
    };
  },
  (rng) => {
    const variant = rng.int(0, 2);
    const v = [
      {
        expr: "\\sin 60^\\circ \\cos 30^\\circ",
        correct: "\\frac{3}{4}",
        swap: "\\frac{1}{4}",
        id: "sin30-cos30-swap",
        work: "\\frac{\\sqrt{3}}{2} \\times \\frac{\\sqrt{3}}{2} = \\frac{3}{4}",
      },
      {
        expr: "\\sin 30^\\circ \\cos 60^\\circ",
        correct: "\\frac{1}{4}",
        swap: "\\frac{3}{4}",
        id: "sin30-cos30-swap",
        work: "\\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{4}",
      },
      {
        expr: "\\tan 60^\\circ \\tan 30^\\circ",
        correct: "1",
        swap: "\\frac{1}{3}",
        id: "tan60-inverted",
        work: "\\sqrt{3} \\times \\frac{1}{\\sqrt{3}} = 1",
      },
    ][variant];
    return {
      skillId: "standard-angles",
      key: `product-${variant}`,
      prompt: `What is ${m(v.expr)}?`,
      correct: m(v.correct),
      distractors: [{ text: m(v.swap), misconceptionId: v.id }],
      fillers: [m("\\frac{\\sqrt{3}}{4}"), m("\\frac{3}{2}"), m("\\sqrt{3}"), m("3")],
      explanation: `Substitute the standard values: ${m(`${v.expr} = ${v.work}`)}.`,
    };
  },
];

type Angle = 30 | 45 | 60;
const tanTimes = (d: number, a: Angle) => (a === 45 ? `${d}` : a === 60 ? `${d}\\sqrt{3}` : `\\frac{${d}}{\\sqrt{3}}`);
const tanDivide = (d: number, a: Angle) => (a === 45 ? `${d}` : a === 60 ? `\\frac{${d}}{\\sqrt{3}}` : `${d}\\sqrt{3}`);
const sinTimes = (d: number, a: Angle) =>
  a === 30 ? `${d / 2}` : a === 45 ? `\\frac{${d}}{\\sqrt{2}}` : `\\frac{${d}\\sqrt{3}}{2}`;
const cosTimes = (d: number, a: Angle) =>
  a === 60 ? `${d / 2}` : a === 45 ? `\\frac{${d}}{\\sqrt{2}}` : `\\frac{${d}\\sqrt{3}}{2}`;
const sinDivide = (d: number, a: Angle) =>
  a === 30 ? `${2 * d}` : a === 45 ? `${d}\\sqrt{2}` : `\\frac{${2 * d}}{\\sqrt{3}}`;
const metres = (tex: string) => `${m(tex)} m`;

export const heightsDistances: Generator[] = [
  (rng) => {
    const d = rng.pick([10, 20, 30, 40, 50, 60]);
    const a = rng.pick([30, 45, 60] as const);
    return {
      skillId: "heights-distances",
      key: `height-${d}-${a}`,
      prompt: `From a point ${d} m from the foot of a tower, the angle of elevation of the top of the tower is ${m(`${a}^\\circ`)}. How tall is the tower?`,
      correct: metres(tanTimes(d, a)),
      distractors: [
        { text: metres(sinTimes(d, a)), misconceptionId: "wrong-ratio-hd" },
        { text: metres(cosTimes(d, a)), misconceptionId: "wrong-ratio-hd" },
        { text: metres(tanDivide(d, a)), misconceptionId: "inverted-tan" },
      ],
      fillers: [metres(`${2 * d}`), metres(`${d + 10}`)],
      explanation: `The height ${m("h")} is opposite the ${m(`${a}^\\circ`)} angle and the ${d} m distance is adjacent to it, so use tan: ${m(`\\tan ${a}^\\circ = \\frac{h}{${d}}`)}, which gives ${m(`h = ${d} \\tan ${a}^\\circ = ${tanTimes(d, a)}`)} m.`,
    };
  },
  (rng) => {
    const h = rng.pick([10, 20, 30, 40, 50, 60]);
    const a = rng.pick([30, 45, 60] as const);
    return {
      skillId: "heights-distances",
      key: `distance-${h}-${a}`,
      prompt: `A tower is ${h} m tall. From a point on level ground, the angle of elevation of its top is ${m(`${a}^\\circ`)}. How far is the point from the foot of the tower?`,
      correct: metres(tanDivide(h, a)),
      distractors: [
        { text: metres(tanTimes(h, a)), misconceptionId: "inverted-tan" },
        { text: metres(sinDivide(h, a)), misconceptionId: "wrong-ratio-hd" },
      ],
      fillers: [metres(`${2 * h}`), metres(`${h + 10}`), metres(`${h / 2}`)],
      explanation: `${m(`\\tan ${a}^\\circ = \\frac{\\text{height}}{\\text{distance}} = \\frac{${h}}{x}`)}, so ${m(`x = \\frac{${h}}{\\tan ${a}^\\circ} = ${tanDivide(h, a)}`)} m.`,
    };
  },
  (rng) => {
    const h = rng.pick([5, 6, 8, 10, 12, 15]);
    const a = rng.pick([30, 45, 60] as const);
    const shadow = a === 45 ? `${h}` : a === 30 ? `${h}\\sqrt{3}` : `\\frac{${h}}{\\sqrt{3}}`;
    const tanText = a === 45 ? "1" : a === 30 ? "\\frac{1}{\\sqrt{3}}" : "\\sqrt{3}";
    return {
      skillId: "heights-distances",
      key: `shadow-${h}-${a}`,
      prompt: `A pole ${h} m tall casts a shadow ${m(shadow)} m long on level ground. What is the angle of elevation of the Sun?`,
      correct: m(`${a}^\\circ`),
      distractors: [{ text: m(`${90 - a}^\\circ`), misconceptionId: "angle-at-wrong-vertex" }],
      fillers: [m("90^\\circ"), m(`${a === 45 ? 60 : 45}^\\circ`), m("15^\\circ")],
      explanation: `The angle of elevation is at the tip of the shadow, on the ground: ${m(`\\tan\\theta = \\frac{\\text{height}}{\\text{shadow}} = \\frac{${h}}{${shadow}} = ${tanText}`)}, so ${m(`\\theta = ${a}^\\circ`)}.`,
    };
  },
];
