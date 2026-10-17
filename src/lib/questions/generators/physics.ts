import { dec, gcd, m, texFrac } from "../fmt";
import type { Generator } from "./types";

const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [9, 12, 15],
  [12, 16, 20],
] as const;

const G = `(Take ${m("g = 10")} m/s² and ignore air resistance.)`;

/** u·cos/sin of 30° or 60° as exact LaTeX. */
function component(u: number, fn: "sin" | "cos", angle: 30 | 60) {
  const half = dec(u / 2, 2);
  const isHalf = (fn === "sin" && angle === 30) || (fn === "cos" && angle === 60);
  return isHalf ? half : `${half}\\sqrt{3}`;
}
function divided(u: number, fn: "sin" | "cos", angle: 30 | 60) {
  const isHalf = (fn === "sin" && angle === 30) || (fn === "cos" && angle === 60);
  return isHalf ? `${2 * u}` : `\\frac{${2 * u}}{\\sqrt{3}}`;
}

export const units: Generator[] = [
  (rng) => {
    const v = rng.pick([18, 36, 54, 72, 90, 108]);
    return {
      skillId: "units",
      key: `kmh-ms-${v}`,
      prompt: `Convert ${v} km/h to m/s.`,
      correct: `${(v * 5) / 18} m/s`,
      distractors: [{ text: `${dec(v * 3.6, 1)} m/s`, misconceptionId: "kmh-times-36" }],
      fillers: [`${dec(v / 1000, 3)} m/s`, `${dec((v * 1000) / 60, 1)} m/s`, `${v} m/s`],
      explanation: `1 km/h is 1000 m in 3600 s, which is ${m("\\frac{5}{18}")} m/s. So ${m(`${v} \\times \\frac{5}{18} = ${(v * 5) / 18}`)} m/s. (Dividing by 3.6 does the same thing.)`,
    };
  },
  (rng) => {
    const v = rng.pick([5, 10, 15, 20, 25, 30]);
    return {
      skillId: "units",
      key: `ms-kmh-${v}`,
      prompt: `Convert ${v} m/s to km/h.`,
      correct: `${dec(v * 3.6, 1)} km/h`,
      distractors: [{ text: `${dec(v / 3.6, 2)} km/h`, misconceptionId: "kmh-times-36" }],
      fillers: [`${v * 1000} km/h`, `${v * 60} km/h`, `${v} km/h`],
      explanation: `To go from m/s to km/h, multiply by 3.6 (that is, ${m("\\frac{18}{5}")}): ${m(`${v} \\times 3.6 = ${dec(v * 3.6, 1)}`)} km/h. A km/h value is always the bigger number.`,
    };
  },
  (rng) => {
    const n = rng.pick([50, 120, 250, 400, 750]);
    return {
      skillId: "units",
      key: `ma-a-${n}`,
      prompt: `Convert ${n} mA to amperes (A).`,
      correct: `${dec(n / 1000, 3)} A`,
      distractors: [
        { text: `${n * 1000} A`, misconceptionId: "prefix-direction" },
        { text: `${dec(n / 100, 2)} A`, misconceptionId: "prefix-direction" },
      ],
      fillers: [`${dec(n / 10, 1)} A`],
      explanation: `"milli" means one-thousandth (${m("10^{-3}")}), so divide by 1000: ${n} mA = ${dec(n / 1000, 3)} A. Converting to a bigger unit gives a smaller number.`,
    };
  },
  (rng) => {
    const a = rng.pick([500, 2500, 4000, 10000, 30000]);
    return {
      skillId: "units",
      key: `cm2-m2-${a}`,
      prompt: `Convert ${a} cm² to m².`,
      correct: `${dec(a / 10000, 4)} m²`,
      distractors: [
        { text: `${dec(a / 100, 2)} m²`, misconceptionId: "area-conversion" },
        { text: `${a * 100} m²`, misconceptionId: "prefix-direction" },
      ],
      fillers: [`${dec(a / 1000, 3)} m²`],
      explanation: `1 m = 100 cm, so 1 m² = 100 × 100 = 10 000 cm². Divide by 10 000: ${a} cm² = ${dec(a / 10000, 4)} m².`,
    };
  },
  (rng) => {
    const g = rng.pick([250, 500, 1500, 2200, 750]);
    return {
      skillId: "units",
      key: `g-kg-${g}`,
      prompt: `Convert ${g} g to kilograms (kg).`,
      correct: `${dec(g / 1000, 3)} kg`,
      distractors: [
        { text: `${g * 1000} kg`, misconceptionId: "prefix-direction" },
        { text: `${dec(g / 100, 2)} kg`, misconceptionId: "prefix-direction" },
      ],
      fillers: [`${dec(g / 10, 1)} kg`],
      explanation: `"kilo" means 1000, so 1 kg = 1000 g. Divide by 1000: ${g} g = ${dec(g / 1000, 3)} kg.`,
    };
  },
];

export const velocity: Generator[] = [
  (rng) => {
    const [s1, s2] = rng.pick([
      [60, 40],
      [30, 60],
      [20, 30],
      [12, 6],
      [90, 45],
      [60, 30],
    ] as const);
    const D = (s1 * s2) / gcd(s1, s2);
    const avg = (2 * s1 * s2) / (s1 + s2);
    return {
      skillId: "velocity",
      key: `round-trip-${s1}-${s2}`,
      prompt: `A bus travels from A to B at ${s1} km/h and comes back from B to A along the same road at ${s2} km/h. What is its average speed for the whole trip?`,
      correct: `${avg} km/h`,
      distractors: [{ text: `${(s1 + s2) / 2} km/h`, misconceptionId: "average-of-speeds" }],
      fillers: [`${s1 + s2} km/h`, `${Math.abs(s1 - s2)} km/h`],
      explanation: `Average speed = total distance ÷ total time. Suppose A to B is ${D} km: going takes ${D / s1} h, coming back takes ${D / s2} h. Total: ${2 * D} km in ${D / s1 + D / s2} h, so ${m(`\\frac{${2 * D}}{${D / s1 + D / s2}} = ${avg}`)} km/h. The bus spends longer at the slower speed, so the answer is below the simple average.`,
    };
  },
  (rng) => {
    const d = rng.int(2, 8);
    const t = rng.pick([1, 2]);
    return {
      skillId: "velocity",
      key: `there-and-back-${d}-${t}`,
      prompt: `Ravi walks ${d} km east and then ${d} km west, ending at the starting point. The walk takes ${t} h in total. What is Ravi's average velocity for the walk?`,
      correct: "0 km/h",
      distractors: [
        { text: `${dec((2 * d) / t, 1)} km/h`, misconceptionId: "velocity-is-speed" },
        { text: `${dec(d / t, 1)} km/h`, misconceptionId: "distance-is-displacement" },
      ],
      fillers: [`${2 * d} km/h`],
      explanation: `Velocity uses displacement, and the walk ends at the starting point, so the displacement is 0 km and the average velocity is 0 km/h. The average speed is ${dec((2 * d) / t, 1)} km/h, because speed uses the total distance (${2 * d} km).`,
    };
  },
  (rng) => {
    const [km, min] = rng.pick([
      [6, 20],
      [9, 30],
      [12, 45],
      [15, 30],
      [4, 15],
    ] as const);
    const ans = km / (min / 60);
    return {
      skillId: "velocity",
      key: `km-per-min-${km}-${min}`,
      prompt: `A cyclist covers ${km} km in ${min} minutes. What is the average speed in km/h?`,
      correct: `${dec(ans, 1)} km/h`,
      distractors: [{ text: `${dec(km / min, 2)} km/h`, misconceptionId: "time-units" }],
      fillers: [`${km * min} km/h`, `${dec(min / km, 2)} km/h`, `${dec(ans / 2, 1)} km/h`],
      explanation: `Convert the time to hours first: ${min} min = ${m(texFrac(min, 60))} h. Then speed = ${m(`\\frac{${km}}{${texFrac(min, 60)}} = ${dec(ans, 1)}`)} km/h.`,
    };
  },
];

export const acceleration: Generator[] = [
  (rng) => {
    const u = rng.int(2, 10);
    const a = rng.int(1, 5);
    const t = rng.int(2, 6);
    const v = u + a * t;
    return {
      skillId: "acceleration",
      key: `speed-up-${u}-${a}-${t}`,
      prompt: `A car's velocity increases from ${u} m/s to ${v} m/s in ${t} s. What is its acceleration?`,
      correct: `${a} m/s²`,
      distractors: [{ text: `${dec(v / t, 2)} m/s²`, misconceptionId: "ignores-initial" }],
      fillers: [`${dec((v + u) / t, 2)} m/s²`, `${(v - u) * t} m/s²`, `${v - u} m/s²`],
      explanation: `Acceleration is the change in velocity per second: ${m(`a = \\frac{v - u}{t} = \\frac{${v} - ${u}}{${t}} = ${a}`)} m/s².`,
    };
  },
  (rng) => {
    const v = rng.int(0, 5);
    const a = rng.int(1, 4);
    const t = rng.int(2, 5);
    const u = v + a * t;
    return {
      skillId: "acceleration",
      key: `brake-${u}-${v}-${t}`,
      prompt: `A cyclist brakes from ${u} m/s to ${v} m/s in ${t} s. What is the cyclist's acceleration?`,
      correct: `${-a} m/s²`,
      distractors: [{ text: `${a} m/s²`, misconceptionId: "sign-ignored" }],
      fillers: [`${dec(u / t, 2)} m/s²`, `${dec(-(u + v) / t, 2)} m/s²`, `${-(u - v)} m/s²`],
      explanation: `${m(`a = \\frac{v - u}{t} = \\frac{${v} - ${u}}{${t}} = ${-a}`)} m/s². The minus sign shows the acceleration points opposite to the motion: the cyclist is slowing down.`,
    };
  },
];

export const motionEquations: Generator[] = [
  (rng) => {
    const u = rng.pick([25, 30, 40]);
    const t = rng.int(1, 2);
    const v = u - 10 * t;
    return {
      skillId: "motion-equations",
      key: `throw-up-v-${u}-${t}`,
      prompt: `A ball is thrown straight up at ${u} m/s. What is its velocity after ${t} s? ${G}`,
      correct: `${v} m/s upward`,
      distractors: [{ text: `${u + 10 * t} m/s upward`, misconceptionId: "gravity-sign" }],
      fillers: [`${u} m/s upward`, `${10 * t} m/s upward`, "0 m/s"],
      explanation: `Taking up as positive, gravity gives an acceleration of ${m("-g")}: ${m(`v = u - gt = ${u} - 10 \\times ${t} = ${v}`)} m/s, still moving upward.`,
    };
  },
  (rng) => {
    const u = rng.int(0, 10);
    const a = rng.pick([2, 4, 6]);
    const t = rng.int(2, 6);
    const s = u * t + (a * t * t) / 2;
    const start = u === 0 ? "A car starts from rest and" : `A car moving at ${u} m/s`;
    return {
      skillId: "motion-equations",
      key: `s-ut-${u}-${a}-${t}`,
      prompt: `${start} accelerates at ${a} m/s² for ${t} s. How far does it travel in that time?`,
      correct: `${s} m`,
      distractors: [{ text: `${u * t + a * t * t} m`, misconceptionId: "forget-half" }],
      fillers: [`${u * t} m`, `${(a * t * t) / 2} m`, `${s + t} m`],
      explanation: `${m(`s = ut + \\frac{1}{2}at^2 = ${u} \\times ${t} + \\frac{1}{2} \\times ${a} \\times ${t}^2 = ${u * t} + ${(a * t * t) / 2} = ${s}`)} m.`,
    };
  },
  (rng) => {
    const [a, s] = rng.pick([
      [2, 4],
      [5, 10],
      [2, 9],
      [8, 4],
      [1, 8],
      [3, 6],
      [10, 5],
      [10, 20],
    ] as const);
    const v = Math.sqrt(2 * a * s);
    return {
      skillId: "motion-equations",
      key: `v2-2as-${a}-${s}`,
      prompt: `An object starts from rest and accelerates at ${a} m/s² over a distance of ${s} m. What is its final speed?`,
      correct: `${v} m/s`,
      distractors: [
        { text: `${dec(Math.sqrt(a * s), 2)} m/s`, misconceptionId: "forget-half" },
        { text: `${a * s} m/s`, misconceptionId: "wrong-equation" },
      ],
      fillers: [`${2 * a * s} m/s`, `${v + 2} m/s`],
      explanation: `No time is given, so use the equation without ${m("t")}: ${m(`v^2 = u^2 + 2as = 0 + 2 \\times ${a} \\times ${s} = ${v * v}`)}, so ${m(`v = ${v}`)} m/s.`,
    };
  },
  (rng) => {
    const u = rng.pick([10, 20, 30, 40]);
    const H = (u * u) / 20;
    return {
      skillId: "motion-equations",
      key: `max-height-${u}`,
      prompt: `A ball is thrown straight up at ${u} m/s. How high does it rise? ${G}`,
      correct: `${H} m`,
      distractors: [
        { text: `${(u * u) / 10} m`, misconceptionId: "forget-half" },
        { text: `${u / 10} m`, misconceptionId: "wrong-equation" },
      ],
      fillers: [`${u * 5} m`, `${H + 5} m`],
      explanation: `At the top ${m("v = 0")}, and no time is given, so use ${m("v^2 = u^2 - 2gh")}: ${m(`0 = ${u}^2 - 2 \\times 10 \\times h`)}, which gives ${m(`h = \\frac{${u * u}}{20} = ${H}`)} m.`,
    };
  },
];

export const vectors: Generator[] = [
  (rng) => {
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      skillId: "vectors",
      key: `right-angle-${a}-${b}`,
      prompt: `Two forces of ${a} N and ${b} N act on an object at right angles to each other. What is the size of the resultant force?`,
      correct: `${c} N`,
      distractors: [
        { text: `${a + b} N`, misconceptionId: "add-magnitudes" },
        { text: `${b - a} N`, misconceptionId: "add-magnitudes" },
      ],
      fillers: [`${a * a + b * b} N`, `${c + 1} N`],
      explanation: `At right angles, combine them with Pythagoras: ${m(`R = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}`)} N. Adding the sizes (${a + b} N) only works when the forces point the same way.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 9);
    const b = a + rng.int(1, 9);
    return {
      skillId: "vectors",
      key: `opposite-${a}-${b}`,
      prompt: `Forces of ${a} N and ${b} N act on a box in opposite directions. What is the resultant force?`,
      correct: `${b - a} N, in the direction of the ${b} N force`,
      distractors: [{ text: `${a + b} N`, misconceptionId: "add-magnitudes" }],
      fillers: [`${m(`\\sqrt{${a * a + b * b}}`)} N`, "0 N", `${b} N`],
      explanation: `Forces in opposite directions partly cancel: ${b} − ${a} = ${b - a} N, pointing the way of the bigger force.`,
    };
  },
];

export const components: Generator[] = [
  (rng) => {
    const F = rng.pick([10, 20, 40, 50, 100]);
    const angle = rng.pick([30, 60] as const);
    const want = rng.pick(["horizontal", "vertical"] as const);
    const fn = want === "horizontal" ? "cos" : "sin";
    const other = want === "horizontal" ? "sin" : "cos";
    return {
      skillId: "components",
      key: `force-${F}-${angle}-${want}`,
      prompt: `A force of ${F} N acts at ${m(`${angle}^\\circ`)} above the horizontal. What is its ${want} component?`,
      correct: `${m(component(F, fn, angle))} N`,
      distractors: [
        { text: `${m(component(F, other, angle))} N`, misconceptionId: "component-swap" },
        { text: `${m(divided(F, fn, angle))} N`, misconceptionId: "component-divide" },
      ],
      fillers: [`${F} N`, `${F * 2} N`],
      explanation: `With the angle measured from the horizontal, the horizontal component is ${m("F\\cos\\theta")} and the vertical component is ${m("F\\sin\\theta")}. Here: ${m(`${F} \\${fn} ${angle}^\\circ = ${component(F, fn, angle)}`)} N.`,
    };
  },
  (rng) => {
    const u = rng.pick([10, 20, 30, 40]);
    const angle = rng.pick([30, 60] as const);
    return {
      skillId: "components",
      key: `kick-${u}-${angle}`,
      prompt: `A football is kicked at ${u} m/s at ${m(`${angle}^\\circ`)} above the ground. What is the vertical part of its velocity?`,
      correct: `${m(component(u, "sin", angle))} m/s`,
      distractors: [
        { text: `${m(component(u, "cos", angle))} m/s`, misconceptionId: "component-swap" },
        { text: `${m(divided(u, "sin", angle))} m/s`, misconceptionId: "component-divide" },
      ],
      fillers: [`${u} m/s`, "0 m/s"],
      explanation: `The vertical component is the side opposite the ${m(`${angle}^\\circ`)} angle: ${m(`u\\sin ${angle}^\\circ = ${u} \\sin ${angle}^\\circ = ${component(u, "sin", angle)}`)} m/s.`,
    };
  },
  (rng) => {
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      skillId: "components",
      key: `other-component-${a}-${c}`,
      prompt: `A ${c} N force has a horizontal component of ${a} N. What is its vertical component?`,
      correct: `${b} N`,
      distractors: [{ text: `${c - a} N`, misconceptionId: "component-sum" }],
      fillers: [`${c + a} N`, `${m(`\\sqrt{${c * c + a * a}}`)} N`, `${b + 1} N`],
      explanation: `A force and its two components form a right triangle with the force as the hypotenuse: ${m(`F_y = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}} = ${b}`)} N. The components don't add up to the force.`,
    };
  },
];

export const projectile: Generator[] = [
  (rng) => {
    const u = rng.pick([10, 20, 30, 40, 50]);
    return {
      skillId: "projectile",
      key: `flight-time-${u}`,
      prompt: `A ball is launched at ${u} m/s at ${m("30^\\circ")} above level ground. How long is it in the air? ${G}`,
      correct: `${dec(u / 10, 2)} s`,
      distractors: [
        { text: `${dec((2 * u) / 10, 2)} s`, misconceptionId: "full-speed-vertical" },
        { text: `${dec((u * Math.sqrt(3)) / 10, 2)} s`, misconceptionId: "full-speed-vertical" },
      ],
      fillers: [`${dec(u / 20, 2)} s`, `${dec(u / 5 + 1, 2)} s`],
      explanation: `Only the vertical part of the velocity decides the time: ${m(`u\\sin 30^\\circ = ${u / 2}`)} m/s. Going up takes ${m(`\\frac{${u / 2}}{10} = ${dec(u / 20, 2)}`)} s, and coming down takes the same, so the total is ${dec(u / 10, 2)} s.`,
    };
  },
  (rng) => {
    const u = rng.pick([20, 40, 60]);
    const H = (u / 2) ** 2 / 20;
    return {
      skillId: "projectile",
      key: `max-height-${u}`,
      prompt: `A stone is thrown at ${u} m/s at ${m("30^\\circ")} above the horizontal. What is the greatest height it reaches? ${G}`,
      correct: `${H} m`,
      distractors: [
        { text: `${(u * u) / 20} m`, misconceptionId: "full-speed-vertical" },
        { text: `${dec((u * u * 0.75) / 20, 1)} m`, misconceptionId: "full-speed-vertical" },
      ],
      fillers: [`${2 * H} m`, `${H + 10} m`],
      explanation: `At the top the vertical velocity is zero. The vertical part of the launch velocity is ${m(`u\\sin 30^\\circ = ${u / 2}`)} m/s, so ${m(`H = \\frac{(${u / 2})^2}{2 \\times 10} = ${H}`)} m.`,
    };
  },
  (rng) => {
    const u = rng.pick([10, 20, 30, 40]);
    const angle = rng.pick([30, 60] as const);
    const horiz = component(u, "cos", angle);
    return {
      skillId: "projectile",
      key: `top-speed-${u}-${angle}`,
      prompt: `A ball is thrown at ${u} m/s at ${m(`${angle}^\\circ`)} above the horizontal. What is its speed at the highest point? (Ignore air resistance.)`,
      correct: `${m(horiz)} m/s`,
      distractors: [
        { text: "0 m/s", misconceptionId: "zero-velocity-top" },
        { text: `${m(component(u, "sin", angle))} m/s`, misconceptionId: "full-speed-vertical" },
      ],
      fillers: [`${u} m/s`, `${2 * u} m/s`],
      explanation: `At the highest point the vertical velocity is zero, but the horizontal velocity never changes: ${m(`u\\cos ${angle}^\\circ = ${horiz}`)} m/s. So the speed there is ${m(horiz)} m/s, not zero.`,
    };
  },
  (rng) => {
    const u = rng.pick([10, 20, 30]);
    const R = (u * u) / 10;
    return {
      skillId: "projectile",
      key: `range-45-${u}`,
      prompt: `A ball is launched at ${u} m/s at ${m("45^\\circ")} over level ground. How far away does it land? ${G}`,
      correct: `${R} m`,
      distractors: [{ text: `${dec(R / Math.SQRT2, 1)} m`, misconceptionId: "full-speed-vertical" }],
      fillers: [`${R / 2} m`, `${2 * R} m`, `${R + 10} m`],
      explanation: `${m(`R = \\frac{u^2 \\sin 2\\theta}{g} = \\frac{${u}^2 \\times \\sin 90^\\circ}{10} = ${R}`)} m. Note it is ${m("\\sin 2\\theta")}, not ${m("\\sin\\theta")}.`,
    };
  },
];

export const current: Generator[] = [
  (rng) => {
    const t = rng.pick([2, 4, 5, 10]);
    const I = rng.int(1, 6);
    const Q = I * t;
    return {
      skillId: "current",
      key: `i-q-t-${Q}-${t}`,
      prompt: `${Q} C of charge flows through a wire in ${t} s. What is the current?`,
      correct: `${I} A`,
      distractors: [{ text: `${dec(t / Q, 3)} A`, misconceptionId: "charge-time-flip" }],
      fillers: [`${Q * t} A`, `${Q + t} A`, `${I + 1} A`],
      explanation: `Current is charge per second: ${m(`I = \\frac{Q}{t} = \\frac{${Q}}{${t}} = ${I}`)} A.`,
    };
  },
  (rng) => {
    const I = rng.pick([0.5, 2, 3, 4]);
    const t = rng.pick([10, 30, 60]);
    return {
      skillId: "current",
      key: `q-it-${I}-${t}`,
      prompt: `A current of ${I} A flows for ${t} s. How much charge passes?`,
      correct: `${dec(I * t, 1)} C`,
      distractors: [
        { text: `${dec(I / t, 3)} C`, misconceptionId: "charge-time-flip" },
        { text: `${dec(t / I, 2)} C`, misconceptionId: "charge-time-flip" },
      ],
      fillers: [`${dec(I + t, 1)} C`],
      explanation: `${m("I = \\frac{Q}{t}")}, so ${m(`Q = It = ${I} \\times ${t} = ${dec(I * t, 1)}`)} C.`,
    };
  },
];

export const voltage: Generator[] = [
  (rng) => {
    const Q = rng.pick([2, 3, 4, 5, 6]);
    const V = rng.pick([2, 3, 4, 6, 12]);
    const W = V * Q;
    return {
      skillId: "voltage",
      key: `v-w-q-${W}-${Q}`,
      prompt: `${W} J of energy is transferred when ${Q} C of charge moves through a lamp. What is the potential difference across the lamp?`,
      correct: `${V} V`,
      distractors: [{ text: `${W * Q} V`, misconceptionId: "voltage-is-charge" }],
      fillers: [`${dec(Q / W, 3)} V`, `${W + Q} V`, `${W} V`],
      explanation: `Potential difference is the energy given to each coulomb: ${m(`V = \\frac{W}{Q} = \\frac{${W}}{${Q}} = ${V}`)} V.`,
    };
  },
];

export const ohmsLaw: Generator[] = [
  (rng) => {
    const R = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const I = rng.pick([0.5, 1, 1.5, 2, 3]);
    const V = R * I;
    return {
      skillId: "ohms-law",
      key: `find-i-${R}-${I}`,
      prompt: `A ${dec(V, 1)} V battery is connected across a ${R} Ω resistor. What current flows?`,
      correct: `${dec(I, 2)} A`,
      distractors: [
        { text: `${dec(V * R, 2)} A`, misconceptionId: "ohm-rearrange" },
        { text: `${dec(R / V, 3)} A`, misconceptionId: "ohm-rearrange" },
      ],
      fillers: [`${dec(V + R, 1)} A`, `${dec(I + 1, 2)} A`],
      explanation: `${m("V = IR")}, so ${m(`I = \\frac{V}{R} = \\frac{${dec(V, 1)}}{${R}} = ${dec(I, 2)}`)} A.`,
    };
  },
  (rng) => {
    const R = rng.pick([2, 4, 5, 6, 8, 10, 12, 20]);
    const I = rng.pick([0.5, 1, 2, 3]);
    const V = R * I;
    return {
      skillId: "ohms-law",
      key: `find-r-${R}-${I}`,
      prompt: `A current of ${I} A flows through a resistor when ${dec(V, 1)} V is applied across it. What is its resistance?`,
      correct: `${R} Ω`,
      distractors: [
        { text: `${dec(V * I, 2)} Ω`, misconceptionId: "ohm-rearrange" },
        { text: `${dec(I / V, 3)} Ω`, misconceptionId: "ohm-rearrange" },
      ],
      fillers: [`${dec(V - I, 1)} Ω`, `${R + 2} Ω`],
      explanation: `${m(`R = \\frac{V}{I} = \\frac{${dec(V, 1)}}{${I}} = ${R}`)} Ω.`,
    };
  },
  (rng) => {
    const v = rng.pick([
      { change: "twice as long", correct: "2R", wrong: "\\frac{R}{2}", why: "Resistance is proportional to length, so doubling the length doubles it." },
      { change: "half as long", correct: "\\frac{R}{2}", wrong: "2R", why: "Resistance is proportional to length, so halving the length halves it." },
      {
        change: "the same length but twice as thick (double the cross-sectional area)",
        correct: "\\frac{R}{2}",
        wrong: "2R",
        why: "Resistance is inversely proportional to area: a thicker wire gives charge more room, so doubling the area halves the resistance.",
      },
      { change: "three times as long", correct: "3R", wrong: "\\frac{R}{3}", why: "Resistance is proportional to length, so three times the length gives three times the resistance." },
    ]);
    return {
      skillId: "ohms-law",
      key: `wire-${v.correct}-${v.change.length}`,
      prompt: `A wire has resistance ${m("R")}. A second wire of the same metal is ${v.change}. What is its resistance?`,
      correct: m(v.correct),
      distractors: [{ text: m(v.wrong), misconceptionId: "length-inverse" }],
      fillers: [m("R"), m("4R"), m("\\frac{R}{4}")],
      explanation: `${m("R = \\rho \\frac{L}{A}")}. ${v.why}`,
    };
  },
];

const PARALLEL_PAIRS = [
  [6, 3],
  [4, 4],
  [12, 6],
  [10, 15],
  [20, 30],
  [12, 4],
  [30, 60],
  [6, 12],
  [8, 8],
] as const;

export const circuits: Generator[] = [
  (rng) => {
    const [R1, R2] = rng.pick(PARALLEL_PAIRS);
    const Rp = (R1 * R2) / (R1 + R2);
    return {
      skillId: "circuits",
      key: `parallel-${R1}-${R2}`,
      prompt: `Resistors of ${R1} Ω and ${R2} Ω are connected in parallel. What is the total resistance?`,
      correct: `${Rp} Ω`,
      distractors: [
        { text: `${R1 + R2} Ω`, misconceptionId: "parallel-adds" },
        { text: `${m(texFrac(1, Rp))} Ω`, misconceptionId: "forgot-reciprocal" },
      ],
      fillers: [`${(R1 + R2) / 2} Ω`, `${R1 * R2} Ω`],
      explanation: `In parallel, ${m(`\\frac{1}{R} = \\frac{1}{${R1}} + \\frac{1}{${R2}} = ${texFrac(R1 + R2, R1 * R2)}`)}, so ${m(`R = ${Rp}`)} Ω. The total is less than the smallest resistor, because the current has two paths.`,
    };
  },
  (rng) => {
    const R = rng.pick([3, 6, 9, 12, 30]);
    return {
      skillId: "circuits",
      key: `three-equal-${R}`,
      prompt: `Three ${R} Ω resistors are connected in parallel. What is the total resistance?`,
      correct: `${dec(R / 3, 2)} Ω`,
      distractors: [
        { text: `${3 * R} Ω`, misconceptionId: "parallel-adds" },
        { text: `${m(texFrac(3, R))} Ω`, misconceptionId: "forgot-reciprocal" },
      ],
      fillers: [`${R} Ω`, `${dec(R / 2, 2)} Ω`],
      explanation: `${m(`\\frac{1}{R} = \\frac{1}{${R}} + \\frac{1}{${R}} + \\frac{1}{${R}} = ${texFrac(3, R)}`)}, so ${m(`R = ${dec(R / 3, 2)}`)} Ω.`,
    };
  },
  (rng) => {
    const R1 = rng.int(1, 9);
    const [R2, R3] = rng.pick(PARALLEL_PAIRS);
    const Rp = (R2 * R3) / (R2 + R3);
    return {
      skillId: "circuits",
      key: `mixed-${R1}-${R2}-${R3}`,
      prompt: `A ${R1} Ω resistor is connected in series with a parallel pair of ${R2} Ω and ${R3} Ω resistors. What is the total resistance?`,
      correct: `${R1 + Rp} Ω`,
      distractors: [{ text: `${R1 + R2 + R3} Ω`, misconceptionId: "parallel-adds" }],
      fillers: [`${Rp} Ω`, `${R1 * Rp} Ω`, `${R1 + Rp + 1} Ω`],
      explanation: `First the parallel pair: ${m(`\\frac{${R2} \\times ${R3}}{${R2} + ${R3}} = ${Rp}`)} Ω. Then add the series resistor: ${m(`${R1} + ${Rp} = ${R1 + Rp}`)} Ω.`,
    };
  },
  (rng) => {
    const [V, R1, R2] = rng.pick([
      [12, 2, 4],
      [12, 1, 5],
      [6, 1, 2],
      [24, 2, 6],
      [24, 4, 8],
      [6, 2, 4],
    ] as const);
    const I = V / (R1 + R2);
    return {
      skillId: "circuits",
      key: `series-current-${V}-${R1}-${R2}`,
      prompt: `A ${V} V battery is connected to ${R1} Ω and ${R2} Ω resistors in series. What current flows?`,
      correct: `${dec(I, 2)} A through both resistors`,
      distractors: [
        {
          text: `${dec(V / R1, 2)} A through the ${R1} Ω and ${dec(V / R2, 2)} A through the ${R2} Ω`,
          misconceptionId: "series-current-splits",
        },
        { text: `${dec(I / 2, 2)} A through each resistor`, misconceptionId: "series-current-splits" },
      ],
      fillers: [`${dec(V / R1 + V / R2, 2)} A`, `${V} A`],
      explanation: `In series the current has only one path, so it is the same everywhere: ${m(`I = \\frac{V}{R_1 + R_2} = \\frac{${V}}{${R1 + R2}} = ${dec(I, 2)}`)} A through both.`,
    };
  },
];
