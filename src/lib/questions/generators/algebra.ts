import { dec, m, signed, texFrac } from "../fmt";
import type { Generator } from "./types";

/** "3x", "x", "-x" for a coefficient k and variable v. */
const coef = (k: number, v = "x") => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);

/** x^2 + bx + c with zero and ±1 terms written properly. */
export function quadTex(b: number, c: number) {
  let s = "x^2";
  if (b) s += b === 1 ? " + x" : b === -1 ? " - x" : ` ${signed(b)}x`;
  if (c) s += ` ${signed(c)}`;
  return s;
}

/** Linear factor with the given root: root 3 -> "(x - 3)", root 0 -> "x". */
const linFactor = (root: number) => (root === 0 ? "x" : `(x ${signed(-root)})`);

/** Product of linear factors for two roots, in a stable order. */
export function factorsTex(r1: number, r2: number) {
  const roots = [r1, r2].sort((a, b) => (a === 0 ? -1 : b === 0 ? 1 : a - b));
  return roots.map(linFactor).join("");
}

/** "$x = -2$ or $x = 3$" with roots sorted. */
export function rootPair(r1: number, r2: number) {
  const [a, b] = [r1, r2].sort((x, y) => x - y);
  return `${m(`x = ${a}`)} or ${m(`x = ${b}`)}`;
}

export const expressions: Generator[] = [
  (rng) => {
    const k = rng.int(2, 9);
    const c = rng.int(1, 9) * rng.pick([1, -1]);
    return {
      skillId: "expressions",
      key: `expand-${k}-${c}`,
      prompt: `Expand ${m(`${k}(x ${signed(c)})`)}.`,
      correct: m(`${k}x ${signed(k * c)}`),
      distractors: [{ text: m(`${k}x ${signed(c)}`), misconceptionId: "distribute-first-only" }],
      fillers: [m(`x ${signed(k * c)}`), m(`${k}x ${signed(k + c)}`), m(`${k + 1}x ${signed(c)}`)],
      explanation: `The ${k} multiplies every term inside the bracket: ${m(`${k} \\times x = ${k}x`)} and ${m(`${k} \\times (${c}) = ${k * c}`)}, so the answer is ${m(`${k}x ${signed(k * c)}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 7);
    const b = rng.int(2, 7);
    const c = rng.int(1, 9);
    return {
      skillId: "expressions",
      key: `like-terms-${a}-${b}-${c}`,
      prompt: `Simplify ${m(`${a}x + ${b}x + ${c}`)}.`,
      correct: m(`${a + b}x + ${c}`),
      distractors: [
        { text: m(`${a + b + c}x`), misconceptionId: "combine-unlike" },
        { text: m(`${a + b + c}`), misconceptionId: "combine-unlike" },
      ],
      fillers: [m(`${a * b}x + ${c}`), m(`${a + b}x^2 + ${c}`)],
      explanation: `Only like terms combine: ${m(`${a}x + ${b}x = ${a + b}x`)}. The ${m(c)} has no ${m("x")}, so it stays separate: ${m(`${a + b}x + ${c}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(10, 18);
    const b = rng.int(1, 9);
    return {
      skillId: "expressions",
      key: `minus-bracket-${a}-${b}`,
      prompt: `Simplify ${m(`${a} - (x - ${b})`)}.`,
      correct: m(`${a + b} - x`),
      distractors: [
        { text: m(`${a - b} - x`), misconceptionId: "minus-bracket" },
        { text: m(`${a - b} + x`), misconceptionId: "minus-bracket" },
      ],
      fillers: [m(`${a + b} + x`), m(`${a} - x`)],
      explanation: `The minus sign in front of the bracket multiplies both terms inside: ${m(`${a} - (x - ${b}) = ${a} - x + ${b} = ${a + b} - x`)}.`,
    };
  },
  (rng) => {
    const p = rng.int(2, 6);
    const q = rng.int(2, 6);
    const r = rng.int(2, 9);
    return {
      skillId: "expressions",
      key: `squares-${p}-${q}-${r}`,
      prompt: `Simplify ${m(`${p}x^2 + ${r}x + ${q}x^2`)}.`,
      correct: m(`${p + q}x^2 + ${r}x`),
      distractors: [
        { text: m(`${p + q + r}x^2`), misconceptionId: "combine-unlike" },
        { text: m(`${p + q + r}x^3`), misconceptionId: "combine-unlike" },
      ],
      fillers: [m(`${p + q}x^4 + ${r}x`), m(`${p * q}x^2 + ${r}x`)],
      explanation: `${m(`x^2`)} terms and ${m("x")} terms are unlike, so they can't be added together. Combine the ${m("x^2")} terms only: ${m(`${p}x^2 + ${q}x^2 = ${p + q}x^2`)}, giving ${m(`${p + q}x^2 + ${r}x`)}.`,
    };
  },
];

export const linearEquations: Generator[] = [
  (rng) => {
    const b = rng.int(2, 20);
    const x = rng.int(2, 20);
    const c = x + b;
    return {
      skillId: "linear-equations",
      key: `x+b-${b}-${c}`,
      prompt: `Solve ${m(`x + ${b} = ${c}`)}.`,
      correct: m(`x = ${x}`),
      distractors: [{ text: m(`x = ${c + b}`), misconceptionId: "transpose-no-sign-change" }],
      fillers: [m(`x = ${b - c}`), m(`x = ${c}`), m(`x = ${x + 1}`)],
      explanation: `Subtract ${b} from both sides: ${m(`x = ${c} - ${b} = ${x}`)}. When ${m(`+${b}`)} moves across the equals sign it becomes ${m(`-${b}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 9);
    const x = rng.int(2, 9);
    const b = rng.int(1, 15);
    const c = a * x + b;
    return {
      skillId: "linear-equations",
      key: `ax+b-${a}-${b}-${c}`,
      prompt: `Solve ${m(`${a}x + ${b} = ${c}`)}.`,
      correct: m(`x = ${x}`),
      distractors: [
        { text: m(`x = ${texFrac(c - a * b, a)}`), misconceptionId: "divide-first" },
        { text: m(`x = ${texFrac(c + b, a)}`), misconceptionId: "transpose-no-sign-change" },
        { text: m(`x = ${c - b - a}`), misconceptionId: "wrong-inverse" },
      ],
      fillers: [m(`x = ${x + 1}`), m(`x = ${c - b}`)],
      explanation: `Undo the operations in reverse order. Subtract ${b} from both sides: ${m(`${a}x = ${c - b}`)}. Then divide by ${a}: ${m(`x = ${x}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 6);
    const x = rng.int(1, 9);
    const b = rng.int(1, 6);
    const c = a * (x + b);
    return {
      skillId: "linear-equations",
      key: `a(x+b)-${a}-${b}-${c}`,
      prompt: `Solve ${m(`${a}(x + ${b}) = ${c}`)}.`,
      correct: m(`x = ${x}`),
      distractors: [
        { text: m(`x = ${c / a + b}`), misconceptionId: "transpose-no-sign-change" },
        { text: m(`x = ${texFrac(c - b, a)}`), misconceptionId: "wrong-inverse" },
      ],
      fillers: [m(`x = ${c - b}`), m(`x = ${c - a - b}`), m(`x = ${x + 2}`)],
      explanation: `Divide both sides by ${a} first: ${m(`x + ${b} = ${c / a}`)}. Then subtract ${b}: ${m(`x = ${x}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 6);
    const x = a * rng.int(2, 8);
    const b = rng.int(1, 9);
    const c = x / a + b;
    return {
      skillId: "linear-equations",
      key: `x/a+b-${a}-${b}-${c}`,
      prompt: `Solve ${m(`\\frac{x}{${a}} + ${b} = ${c}`)}.`,
      correct: m(`x = ${x}`),
      distractors: [
        { text: m(`x = ${texFrac(c - b, a)}`), misconceptionId: "wrong-inverse" },
        { text: m(`x = ${a * (c + b)}`), misconceptionId: "transpose-no-sign-change" },
      ],
      fillers: [m(`x = ${a * c - b}`), m(`x = ${x + a}`)],
      explanation: `Subtract ${b}: ${m(`\\frac{x}{${a}} = ${c - b}`)}. Dividing by ${a} is undone by multiplying by ${a}: ${m(`x = ${c - b} \\times ${a} = ${x}`)}.`,
    };
  },
];

interface RearrangeFamily {
  formula: string;
  target: string;
  correct: string;
  partial: string[];
  inverse: string[];
  fillers: string[];
  steps: string;
}

const FAMILIES: RearrangeFamily[] = [
  {
    formula: "v = u + at",
    target: "a",
    correct: "\\frac{v - u}{t}",
    partial: ["\\frac{v}{t} - u"],
    inverse: ["\\frac{v + u}{t}", "(v - u)t"],
    fillers: ["\\frac{t}{v - u}"],
    steps: "Subtract $u$ from both sides: $v - u = at$. Then divide by $t$: $a = \\frac{v - u}{t}$.",
  },
  {
    formula: "V = IR",
    target: "R",
    correct: "\\frac{V}{I}",
    partial: [],
    inverse: ["\\frac{I}{V}", "VI"],
    fillers: ["V - I"],
    steps: "$R$ is multiplied by $I$, so divide both sides by $I$: $R = \\frac{V}{I}$.",
  },
  {
    formula: "I = \\frac{Q}{t}",
    target: "Q",
    correct: "It",
    partial: [],
    inverse: ["\\frac{I}{t}", "\\frac{t}{I}"],
    fillers: ["I + t"],
    steps: "$Q$ is divided by $t$, so multiply both sides by $t$: $Q = It$.",
  },
  {
    formula: "s = \\frac{1}{2}at^2",
    target: "t",
    correct: "\\sqrt{\\frac{2s}{a}}",
    partial: ["\\frac{2s}{a}"],
    inverse: ["\\sqrt{\\frac{s}{2a}}"],
    fillers: ["\\frac{\\sqrt{2s}}{a}", "\\frac{2s}{a^2}"],
    steps: "Multiply by 2: $2s = at^2$. Divide by $a$: $t^2 = \\frac{2s}{a}$. Take the square root last: $t = \\sqrt{\\frac{2s}{a}}$.",
  },
  {
    formula: "P = 2(l + b)",
    target: "l",
    correct: "\\frac{P}{2} - b",
    partial: ["\\frac{P - b}{2}"],
    inverse: ["\\frac{P}{2} + b", "2P - b"],
    fillers: [],
    steps: "Divide by 2: $\\frac{P}{2} = l + b$. Then subtract $b$: $l = \\frac{P}{2} - b$.",
  },
  {
    formula: "F = ma",
    target: "a",
    correct: "\\frac{F}{m}",
    partial: [],
    inverse: ["\\frac{m}{F}", "Fm"],
    fillers: ["F - m"],
    steps: "$a$ is multiplied by $m$, so divide both sides by $m$: $a = \\frac{F}{m}$.",
  },
  {
    formula: "v^2 = u^2 + 2as",
    target: "s",
    correct: "\\frac{v^2 - u^2}{2a}",
    partial: ["\\frac{v^2}{2a} - u^2"],
    inverse: ["\\frac{v^2 + u^2}{2a}"],
    fillers: ["\\frac{2a}{v^2 - u^2}", "2a(v^2 - u^2)"],
    steps: "Subtract $u^2$ from both sides: $v^2 - u^2 = 2as$. Then divide by $2a$: $s = \\frac{v^2 - u^2}{2a}$.",
  },
  {
    formula: "n = \\frac{m}{M}",
    target: "m",
    correct: "nM",
    partial: [],
    inverse: ["\\frac{n}{M}", "\\frac{M}{n}"],
    fillers: ["n + M"],
    steps: "$m$ is divided by $M$, so multiply both sides by $M$: $m = nM$.",
  },
  {
    formula: "W = QV",
    target: "V",
    correct: "\\frac{W}{Q}",
    partial: [],
    inverse: ["\\frac{Q}{W}", "WQ"],
    fillers: ["W - Q"],
    steps: "$V$ is multiplied by $Q$, so divide both sides by $Q$: $V = \\frac{W}{Q}$.",
  },
];

export const rearranging: Generator[] = [
  (rng) => {
    const i = rng.int(0, FAMILIES.length - 1);
    const f = FAMILIES[i];
    const as = (rhs: string) => m(`${f.target} = ${rhs}`);
    return {
      skillId: "rearranging",
      key: `family-${i}`,
      prompt: `Make ${m(f.target)} the subject of ${m(f.formula)}.`,
      correct: as(f.correct),
      distractors: [
        ...f.partial.map((t) => ({ text: as(t), misconceptionId: "partial-undo" })),
        ...f.inverse.map((t) => ({ text: as(t), misconceptionId: "inverse-op-wrong" })),
      ],
      fillers: f.fillers.map(as),
      explanation: f.steps,
    };
  },
];

export const identities: Generator[] = [
  (rng) => {
    const a = rng.int(1, 9);
    return {
      skillId: "identities",
      key: `sq-sum-${a}`,
      prompt: `Expand ${m(`(x + ${a})^2`)}.`,
      correct: m(quadTex(2 * a, a * a)),
      distractors: [{ text: m(quadTex(0, a * a)), misconceptionId: "square-of-sum" }],
      fillers: [m(quadTex(a, a * a)), m(`2x + ${2 * a}`), m(quadTex(2 * a, 2 * a))],
      explanation: `${m(`(x + ${a})^2 = (x + ${a})(x + ${a}) = x^2 + ${coef(a)} + ${coef(a)} + ${a * a} = ${quadTex(2 * a, a * a)}`)}. The middle term ${m(coef(2 * a))} is the one people forget.`,
    };
  },
  (rng) => {
    const a = rng.int(1, 9);
    return {
      skillId: "identities",
      key: `sq-diff-${a}`,
      prompt: `Expand ${m(`(x - ${a})^2`)}.`,
      correct: m(quadTex(-2 * a, a * a)),
      distractors: [
        { text: m(quadTex(2 * a, a * a)), misconceptionId: "middle-term-sign" },
        { text: m(quadTex(0, -a * a)), misconceptionId: "square-of-sum" },
      ],
      fillers: [m(quadTex(-2 * a, -a * a)), m(quadTex(0, a * a))],
      explanation: `${m(`(x - ${a})^2 = x^2 - 2 \\cdot ${a} \\cdot x + ${a}^2 = ${quadTex(-2 * a, a * a)}`)}. The middle term is negative, the last term is positive (a negative times a negative).`,
    };
  },
  (rng) => {
    const a = rng.int(2, 9);
    return {
      skillId: "identities",
      key: `diff-squares-${a}`,
      prompt: `Factorise ${m(`x^2 - ${a * a}`)}.`,
      correct: m(`(x - ${a})(x + ${a})`),
      distractors: [{ text: m(`(x - ${a})^2`), misconceptionId: "diff-squares" }],
      fillers: [m(`(x + ${a})^2`), m(`(x - ${a * a})(x + 1)`), m(`x(x - ${a * a})`)],
      explanation: `${m(`x^2 - ${a * a}`)} is a difference of two squares, ${m(`x^2 - ${a}^2`)}, and ${m(`a^2 - b^2 = (a - b)(a + b)`)}. So it is ${m(`(x - ${a})(x + ${a})`)}. Note ${m(`(x - ${a})^2 = ${quadTex(-2 * a, a * a)}`)}, which is different.`,
    };
  },
  (rng) => {
    const k = rng.int(1, 9);
    const ans = (100 + k) ** 2;
    return {
      skillId: "identities",
      key: `hundred-${k}`,
      prompt: `What is ${m(`${100 + k}^2`)}? (Think of it as ${m(`(100 + ${k})^2`)}.)`,
      correct: m(ans),
      distractors: [{ text: m(10000 + k * k), misconceptionId: "square-of-sum" }],
      fillers: [m(10000 + 100 * k + k * k), m(ans + 100), m(ans - 10)],
      explanation: `${m(`(100 + ${k})^2 = 100^2 + 2 \\cdot 100 \\cdot ${k} + ${k}^2 = 10000 + ${200 * k} + ${k * k} = ${ans}`)}.`,
    };
  },
];

function pq(rng: Parameters<Generator>[0]) {
  let p = 0;
  let q = 0;
  do {
    p = rng.int(-7, 7);
    q = rng.int(-7, 7);
  } while (p === 0 || q === 0 || p === q || p === -q);
  return [p, q] as const;
}

export const factorisation: Generator[] = [
  (rng) => {
    const [p, q] = pq(rng);
    const b = p + q;
    const c = p * q;
    // Factors (x + p)(x + q) have roots -p and -q.
    return {
      skillId: "factorisation",
      key: `factorise-${Math.min(p, q)}-${Math.max(p, q)}`,
      prompt: `Factorise ${m(quadTex(b, c))}.`,
      correct: m(factorsTex(-p, -q)),
      distractors: [
        { text: m(factorsTex(p, q)), misconceptionId: "sign-error-factors" },
        { text: m(factorsTex(p, -q)), misconceptionId: "sign-error-factors" },
      ],
      fillers: [m(factorsTex(-p - 1, -q + 1)), m(factorsTex(-b, -1)), m(factorsTex(-p, q))],
      explanation: `Find two numbers that multiply to ${c} and add to ${b}: they are ${p} and ${q}. So ${m(`${quadTex(b, c)} = ${factorsTex(-p, -q)}`)}. Check by expanding.`,
    };
  },
  (rng) => {
    let p = 1;
    let q = 1;
    do {
      p = rng.int(1, 9);
      q = rng.int(1, 9);
    } while (p === q);
    const b = p + q;
    const c = p * q;
    return {
      skillId: "factorisation",
      key: `sum-product-${Math.min(p, q)}-${Math.max(p, q)}`,
      prompt: `To factorise ${m(quadTex(b, c))}, you look for two numbers that…`,
      correct: `multiply to ${c} and add to ${b}`,
      distractors: [{ text: `add to ${c} and multiply to ${b}`, misconceptionId: "sum-product-swap" }],
      fillers: [`add to ${b + c}`, `multiply to ${b * c}`, `multiply to ${b} and add to ${b}`],
      explanation: `In ${m(`(x + p)(x + q) = x^2 + (p + q)x + pq`)}, the numbers multiply to give the constant (${c}) and add to give the middle coefficient (${b}). Here they are ${Math.min(p, q)} and ${Math.max(p, q)}.`,
    };
  },
  (rng) => {
    const [p, q] = pq(rng);
    const b = p + q;
    const c = p * q;
    const f = (k: number) => m(k === 0 ? "x" : `(x ${signed(k)})`);
    return {
      skillId: "factorisation",
      key: `which-factor-${p}-${q}`,
      prompt: `Which of these is a factor of ${m(quadTex(b, c))}?`,
      correct: f(p),
      distractors: [
        { text: f(-p), misconceptionId: "sign-error-factors" },
        { text: f(-q), misconceptionId: "sign-error-factors" },
      ],
      fillers: [f(b), f(c), f(p + 1)],
      explanation: `${m(`${quadTex(b, c)} = (x ${signed(p)})(x ${signed(q)})`)}, because ${p} × ${q} = ${c} and ${p} + ${q} = ${b}. So ${f(p)} is a factor.`,
    };
  },
];

const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25],
  [12, 16, 20],
] as const;

export const squareRoots: Generator[] = [
  (rng) => {
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      skillId: "square-roots",
      key: `root-sum-${a}-${b}`,
      prompt: `What is ${m(`\\sqrt{${a * a} + ${b * b}}`)}?`,
      correct: m(c),
      distractors: [
        { text: m(a + b), misconceptionId: "root-of-sum" },
        { text: m(dec((a * a + b * b) / 2, 1)), misconceptionId: "root-halves" },
      ],
      fillers: [m(c * c), m(c + 1)],
      explanation: `Add first, then take the root: ${m(`${a * a} + ${b * b} = ${c * c}`)}, and ${m(`\\sqrt{${c * c}} = ${c}`)}. Square roots don't split over addition: ${m(`\\sqrt{${a * a}} + \\sqrt{${b * b}} = ${a + b}`)} is a different number.`,
    };
  },
  (rng) => {
    const n = rng.int(4, 15);
    const sq = n * n;
    return {
      skillId: "square-roots",
      key: `root-${sq}`,
      prompt: `What is ${m(`\\sqrt{${sq}}`)}?`,
      correct: m(n),
      distractors: [{ text: m(dec(sq / 2, 1)), misconceptionId: "root-halves" }],
      fillers: [m(2 * n), m(n + 1), m(n - 1)],
      explanation: `${m(`\\sqrt{${sq}} = ${n}`)} because ${m(`${n} \\times ${n} = ${sq}`)}. The square root is the number that multiplies by itself to give ${sq}, not half of it.`,
    };
  },
  (rng) => {
    const d = rng.int(2, 9);
    const val = dec((d * d) / 100, 4);
    return {
      skillId: "square-roots",
      key: `root-dec-${d}`,
      prompt: `What is ${m(`\\sqrt{${val}}`)}?`,
      correct: m(dec(d / 10, 2)),
      distractors: [
        { text: m(dec(d / 100, 3)), misconceptionId: "decimal-root" },
        { text: m(dec((d * d) / 200, 4)), misconceptionId: "root-halves" },
      ],
      fillers: [m(dec(d / 1000, 4)), m(d)],
      explanation: `${m(`0.${d} \\times 0.${d} = ${val}`)}, so ${m(`\\sqrt{${val}} = ${dec(d / 10, 2)}`)}. Check by squaring your answer.`,
    };
  },
  (rng) => {
    const k = rng.int(4, 12);
    const n = k * k + rng.int(1, 2 * k);
    const half = Math.floor(n / 2);
    return {
      skillId: "square-roots",
      key: `estimate-${n}`,
      prompt: `${m(`\\sqrt{${n}}`)} lies between which two whole numbers?`,
      correct: `${k} and ${k + 1}`,
      distractors: [{ text: `${half} and ${half + 1}`, misconceptionId: "root-halves" }],
      fillers: [`${k - 1} and ${k}`, `${k + 1} and ${k + 2}`],
      explanation: `${m(`${k}^2 = ${k * k}`)} and ${m(`${k + 1}^2 = ${(k + 1) ** 2}`)}. Since ${n} is between them, ${m(`\\sqrt{${n}}`)} is between ${k} and ${k + 1}.`,
    };
  },
];

export const quadratics: Generator[] = [
  (rng) => {
    let p = 0;
    let q = 0;
    do {
      p = rng.int(-8, 8);
      q = rng.int(-8, 8);
    } while (p === 0 || q === 0 || p === q || p === -q);
    const b = -(p + q);
    const c = p * q;
    return {
      skillId: "quadratics",
      key: `solve-${Math.min(p, q)}-${Math.max(p, q)}`,
      prompt: `Solve ${m(`${quadTex(b, c)} = 0`)}.`,
      correct: rootPair(p, q),
      distractors: [
        { text: rootPair(-p, -q), misconceptionId: "root-sign" },
        { text: `${m(`x = ${Math.max(p, q)}`)} only`, misconceptionId: "one-root-only" },
      ],
      fillers: [rootPair(p + q, p * q), rootPair(p, -q)],
      explanation: `Factorise: ${m(`${factorsTex(p, q)} = 0`)}. A product is zero only when one of its factors is zero, so ${rootPair(p, q)}.`,
    };
  },
  (rng) => {
    const k = rng.int(2, 12);
    return {
      skillId: "quadratics",
      key: `x2-kx-${k}`,
      prompt: `Solve ${m(`x^2 = ${k}x`)}.`,
      correct: `${m("x = 0")} or ${m(`x = ${k}`)}`,
      distractors: [
        { text: `${m(`x = ${k}`)} only`, misconceptionId: "divide-by-x" },
        { text: `${m("x = 0")} or ${m(`x = -${k}`)}`, misconceptionId: "root-sign" },
      ],
      fillers: [`${m(`x = ${k}`)} or ${m(`x = -${k}`)}`],
      explanation: `Don't divide both sides by ${m("x")}: it might be 0, and you would lose that root. Rearrange and factorise instead: ${m(`x^2 - ${k}x = 0 \\Rightarrow x(x - ${k}) = 0`)}, so ${m("x = 0")} or ${m(`x = ${k}`)}.`,
    };
  },
  (rng) => {
    let p = 0;
    let q = 0;
    do {
      p = rng.int(-9, 9);
      q = rng.int(-9, 9);
    } while (p === 0 || q === 0 || p === q || p === -q);
    return {
      skillId: "quadratics",
      key: `zero-product-${Math.min(p, q)}-${Math.max(p, q)}`,
      prompt: `If ${m(`${factorsTex(p, q)} = 0`)}, what is ${m("x")}?`,
      correct: rootPair(p, q),
      distractors: [
        { text: rootPair(-p, -q), misconceptionId: "root-sign" },
        { text: `${m(`x = ${p}`)} only`, misconceptionId: "one-root-only" },
      ],
      fillers: [rootPair(p, -q)],
      explanation: `Set each factor to zero: ${m(`x ${signed(-p)} = 0`)} gives ${m(`x = ${p}`)}, and ${m(`x ${signed(-q)} = 0`)} gives ${m(`x = ${q}`)}.`,
    };
  },
  (rng) => {
    const r = rng.int(2, 12);
    const c = r * r;
    return {
      skillId: "quadratics",
      key: `x2-c-${c}`,
      prompt: `Solve ${m(`x^2 = ${c}`)}.`,
      correct: `${m(`x = ${r}`)} or ${m(`x = -${r}`)}`,
      distractors: [{ text: `${m(`x = ${r}`)} only`, misconceptionId: "one-root-only" }],
      fillers: [m(`x = ${dec(c / 2, 1)}`), `${m(`x = ${c}`)} or ${m(`x = -${c}`)}`],
      explanation: `Both ${m(`${r}^2`)} and ${m(`(-${r})^2`)} equal ${c}, so there are two roots: ${m(`x = \\pm ${r}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(1, 4);
    const b = a + rng.int(1, 4);
    const d = rng.int(1, 3);
    const r = b + d;
    const s = a - d;
    const k = d * (b - a) + d * d;
    return {
      skillId: "quadratics",
      key: `nonzero-${a}-${b}-${k}`,
      prompt: `Solve ${m(`${factorsTex(a, b)} = ${k}`)}.`,
      correct: rootPair(r, s),
      distractors: [
        { text: rootPair(a + k, b + k), misconceptionId: "zero-product-nonzero" },
        { text: rootPair(a, b), misconceptionId: "zero-product-nonzero" },
      ],
      fillers: [rootPair(-r, -s), rootPair(r, -s)],
      explanation: `The "set each factor to zero" rule only works when the right side is 0. Expand and rearrange first: ${m(`${quadTex(-(a + b), a * b)} = ${k} \\Rightarrow ${quadTex(-(a + b), a * b - k)} = 0`)}, which factorises as ${m(`${factorsTex(r, s)} = 0`)}. So ${rootPair(r, s)}.`,
    };
  },
];
