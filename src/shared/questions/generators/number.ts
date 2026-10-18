import { dec, gcd, m, texFrac } from "../fmt";
import type { Generator } from "./types";

export const integers: Generator[] = [
  (rng) => {
    const a = rng.int(2, 15);
    const b = rng.int(2, 15);
    const ans = a + b;
    return {
      skillId: "integers",
      key: `sub-neg-${a}-${b}`,
      prompt: `What is ${m(`${a} - (-${b})`)}?`,
      correct: m(ans),
      distractors: [
        { text: m(a - b), misconceptionId: "minus-signs" },
        { text: m(-ans), misconceptionId: "minus-signs" },
      ],
      fillers: [m(ans + 1), m(b - a), m(ans - 2)],
      explanation: `Subtracting a negative is the same as adding: ${m(`${a} - (-${b}) = ${a} + ${b} = ${ans}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 12);
    const b = rng.int(2, 12);
    const ans = a * b;
    return {
      skillId: "integers",
      key: `mul-neg-${a}-${b}`,
      prompt: `What is ${m(`(-${a}) \\times (-${b})`)}?`,
      correct: m(ans),
      distractors: [{ text: m(-ans), misconceptionId: "neg-times-neg" }],
      fillers: [m(-(a + b)), m(a + b), m(ans + a)],
      explanation: `A negative times a negative is positive: ${m(`(-${a}) \\times (-${b}) = ${ans}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(6, 20);
    const b = rng.int(2, a - 1);
    const ans = b - a;
    return {
      skillId: "integers",
      key: `neg-plus-${a}-${b}`,
      prompt: `What is ${m(`-${a} + ${b}`)}?`,
      correct: m(ans),
      distractors: [
        { text: m(a - b), misconceptionId: "sign-of-sum" },
        { text: m(-(a + b)), misconceptionId: "sign-of-sum" },
      ],
      fillers: [m(a + b), m(ans - 1)],
      explanation: `The signs are different, so subtract the sizes (${m(`${a} - ${b} = ${a - b}`)}) and keep the sign of the bigger size, which is negative: ${m(`-${a} + ${b} = ${ans}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 15);
    let b = rng.int(2, 15);
    if (b === a) b += 1;
    const ans = -(a + b);
    return {
      skillId: "integers",
      key: `neg-minus-${a}-${b}`,
      prompt: `What is ${m(`-${a} - ${b}`)}?`,
      correct: m(ans),
      distractors: [
        { text: m(a + b), misconceptionId: "minus-signs" },
        { text: m(b - a), misconceptionId: "sign-of-sum" },
      ],
      fillers: [m(a - b), m(ans + 1)],
      explanation: `Start at ${m(-a)} and move ${b} further left on the number line: ${m(`-${a} - ${b} = ${ans}`)}. "Two minuses make a plus" only applies when they meet directly, as in ${m(`-(-${b})`)}.`,
    };
  },
];

export const bodmas: Generator[] = [
  (rng) => {
    const a = rng.int(2, 12);
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    const ans = a + b * c;
    return {
      skillId: "bodmas",
      key: `a+bc-${a}-${b}-${c}`,
      prompt: `What is ${m(`${a} + ${b} \\times ${c}`)}?`,
      correct: m(ans),
      distractors: [{ text: m((a + b) * c), misconceptionId: "left-to-right" }],
      fillers: [m(a * b + c), m(a + b + c), m(ans + 1)],
      explanation: `Multiply before adding: ${m(`${b} \\times ${c} = ${b * c}`)}, then ${m(`${a} + ${b * c} = ${ans}`)}.`,
    };
  },
  (rng) => {
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    const a = b + c + rng.int(3, 12);
    const ans = a - b + c;
    return {
      skillId: "bodmas",
      key: `a-b+c-${a}-${b}-${c}`,
      prompt: `What is ${m(`${a} - ${b} + ${c}`)}?`,
      correct: m(ans),
      distractors: [{ text: m(a - (b + c)), misconceptionId: "add-before-subtract" }],
      fillers: [m(a + b + c), m(ans + 2), m(a + b - c)],
      explanation: `Addition and subtraction have equal priority, so work left to right: ${m(`${a} - ${b} = ${a - b}`)}, then ${m(`${a - b} + ${c} = ${ans}`)}.`,
    };
  },
  (rng) => {
    const b = rng.int(2, 5);
    const c = rng.int(2, 5);
    const k = rng.int(2, 6);
    const a = b * c * k;
    const ans = (a / b) * c;
    return {
      skillId: "bodmas",
      key: `a/b*c-${a}-${b}-${c}`,
      prompt: `What is ${m(`${a} \\div ${b} \\times ${c}`)}?`,
      correct: m(ans),
      distractors: [{ text: m(k), misconceptionId: "multiply-before-divide" }],
      fillers: [m(a / b + c), m(ans * 2), m(ans - c)],
      explanation: `Division and multiplication have equal priority, so go left to right: ${m(`${a} \\div ${b} = ${a / b}`)}, then ${m(`${a / b} \\times ${c} = ${ans}`)}.`,
    };
  },
  (rng) => {
    const b = rng.int(2, 6);
    const c = rng.int(2, 6);
    const a = b * c + rng.int(2, 15);
    const ans = a - b * c;
    return {
      skillId: "bodmas",
      key: `a-bc-${a}-${b}-${c}`,
      prompt: `What is ${m(`${a} - ${b} \\times ${c}`)}?`,
      correct: m(ans),
      distractors: [{ text: m((a - b) * c), misconceptionId: "left-to-right" }],
      fillers: [m(a - b - c), m(a + b * c), m(ans + 3)],
      explanation: `Multiply first: ${m(`${b} \\times ${c} = ${b * c}`)}, then subtract: ${m(`${a} - ${b * c} = ${ans}`)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.int(2, 6);
    const ans = (a + b) * c;
    return {
      skillId: "bodmas",
      key: `(a+b)c-${a}-${b}-${c}`,
      prompt: `What is ${m(`(${a} + ${b}) \\times ${c}`)}?`,
      correct: m(ans),
      distractors: [{ text: m(a + b * c), misconceptionId: "ignores-brackets" }],
      fillers: [m(a * c + b), m(a + b + c), m(ans + c)],
      explanation: `Brackets first: ${m(`${a} + ${b} = ${a + b}`)}, then ${m(`${a + b} \\times ${c} = ${ans}`)}.`,
    };
  },
];

export const fractions: Generator[] = [
  (rng) => {
    const dens = rng
      .shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12])
      .slice(0, 4)
      .sort((x, y) => x - y);
    const opts = dens.map((d) => m(`\\frac{1}{${d}}`));
    return {
      skillId: "fractions",
      key: `largest-unit-${dens.join("-")}`,
      prompt: "Which of these fractions is the largest?",
      correct: opts[0],
      distractors: [{ text: opts[3], misconceptionId: "bigger-denominator" }],
      fillers: [opts[2], opts[1]],
      explanation: `All four have 1 on top, so compare the size of the pieces. Cutting a whole into ${dens[0]} pieces gives bigger pieces than cutting it into ${dens[3]}, so ${opts[0]} is the largest.`,
    };
  },
  (rng) => {
    let p = 1;
    let q = 2;
    do {
      q = rng.int(3, 9);
      p = rng.int(1, q - 1);
    } while (gcd(p, q) !== 1);
    const k = rng.int(2, 4);
    return {
      skillId: "fractions",
      key: `equiv-${p}-${q}-${k}`,
      prompt: `Which fraction is equal to ${m(`\\frac{${p}}{${q}}`)}?`,
      correct: m(`\\frac{${p * k}}{${q * k}}`),
      distractors: [
        { text: m(`\\frac{${p + 1}}{${q + 1}}`), misconceptionId: "equivalent-add" },
        { text: m(`\\frac{${p + k}}{${q + k}}`), misconceptionId: "equivalent-add" },
      ],
      fillers: [m(`\\frac{${p * k}}{${q}}`), m(`\\frac{${q}}{${p}}`)],
      explanation: `Multiply the top and the bottom by the same number: ${m(`\\frac{${p}}{${q}} = \\frac{${p} \\times ${k}}{${q} \\times ${k}} = \\frac{${p * k}}{${q * k}}`)}. Adding the same number to the top and bottom changes the value.`,
    };
  },
  (rng) => {
    const q = rng.pick([3, 4, 5, 6]);
    const p = rng.int(1, q - 1);
    const s = q * rng.pick([2, 3]);
    const r = p * (s / q) - 1;
    const big = m(`\\frac{${p}}{${q}}`);
    const small = m(`\\frac{${r}}{${s}}`);
    return {
      skillId: "fractions",
      key: `compare-${p}-${q}-${r}-${s}`,
      prompt: `Which is greater: ${big} or ${small}?`,
      correct: big,
      distractors: [
        { text: small, misconceptionId: "whole-number-compare" },
        { text: "They are equal", misconceptionId: null },
      ],
      fillers: ["They can't be compared because the denominators are different"],
      explanation: `Write both with denominator ${s}: ${m(`\\frac{${p}}{${q}} = \\frac{${(p * s) / q}}{${s}}`)}, which is more than ${small}. Bigger numbers on the top and bottom don't make a bigger fraction.`,
    };
  },
  (rng) => {
    const a = rng.int(3, 9);
    const b = rng.int(a + 1, 12);
    return {
      skillId: "fractions",
      key: `smaller-unit-${a}-${b}`,
      prompt: `Which is smaller: ${m(`\\frac{1}{${a}}`)} or ${m(`\\frac{1}{${b}}`)}?`,
      correct: m(`\\frac{1}{${b}}`),
      distractors: [
        { text: m(`\\frac{1}{${a}}`), misconceptionId: "bigger-denominator" },
        { text: "They are equal, because both have 1 on top", misconceptionId: null },
      ],
      fillers: ["You need a calculator to tell"],
      explanation: `${m(`\\frac{1}{${b}}`)} is one of ${b} equal pieces, and ${m(`\\frac{1}{${a}}`)} is one of only ${a}. More pieces means each piece is smaller, so ${m(`\\frac{1}{${b}}`)} is smaller.`,
    };
  },
];

function fracExplanation(steps: string, n: number, d: number) {
  const simp = texFrac(n, d);
  const raw = `\\frac{${n}}{${d}}`;
  return simp === raw ? m(`${steps} = ${raw}`) : m(`${steps} = ${raw} = ${simp}`);
}

export const fractionOps: Generator[] = [
  (rng) => {
    const b = rng.pick([2, 3, 4, 5, 6]);
    let d = rng.pick([2, 3, 4, 5, 6, 7, 8]);
    if (d === b) d = b + 1;
    const a = rng.int(1, b - 1);
    const c = rng.int(1, d - 1);
    const n = a * d + c * b;
    const den = b * d;
    return {
      skillId: "fraction-ops",
      key: `add-${a}-${b}-${c}-${d}`,
      prompt: `What is ${m(`\\frac{${a}}{${b}} + \\frac{${c}}{${d}}`)}?`,
      correct: m(texFrac(n, den)),
      distractors: [
        { text: m(texFrac(a + c, b + d)), misconceptionId: "add-across" },
        { text: m(texFrac(a + c, b * d)), misconceptionId: "add-across" },
      ],
      fillers: [m(texFrac(a * c, b * d)), m(texFrac(n, b + d))],
      explanation: `Make the denominators equal first, then add the tops: ${fracExplanation(
        `\\frac{${a}}{${b}} + \\frac{${c}}{${d}} = \\frac{${a * d}}{${den}} + \\frac{${c * b}}{${den}}`,
        n,
        den,
      )}.`,
    };
  },
  (rng) => {
    const a = rng.int(1, 5);
    const b = rng.int(2, 7);
    const c = rng.int(1, 5);
    let d = rng.int(2, 7);
    if (d === c) d += 1;
    return {
      skillId: "fraction-ops",
      key: `div-${a}-${b}-${c}-${d}`,
      prompt: `What is ${m(`\\frac{${a}}{${b}} \\div \\frac{${c}}{${d}}`)}?`,
      correct: m(texFrac(a * d, b * c)),
      distractors: [
        { text: m(texFrac(a * c, b * d)), misconceptionId: "divide-no-flip" },
        { text: m(texFrac(b * c, a * d)), misconceptionId: "flip-wrong" },
      ],
      fillers: [m(texFrac(a + c, b + d)), m(texFrac(a * d, b + c)), m(texFrac(a * d + 1, b * c))],
      explanation: `Dividing by a fraction means multiplying by its reciprocal, so flip the second fraction: ${fracExplanation(
        `\\frac{${a}}{${b}} \\times \\frac{${d}}{${c}}`,
        a * d,
        b * c,
      )}.`,
    };
  },
  (rng) => {
    const a = rng.int(1, 6);
    const b = rng.int(2, 7);
    const c = rng.int(1, 6);
    const d = rng.int(2, 7);
    return {
      skillId: "fraction-ops",
      key: `mul-${a}-${b}-${c}-${d}`,
      prompt: `What is ${m(`\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}`)}?`,
      correct: m(texFrac(a * c, b * d)),
      distractors: [{ text: m(texFrac(a + c, b + d)), misconceptionId: "add-across" }],
      fillers: [m(texFrac(a * d, b * c)), m(texFrac(a * c, b + d)), m(texFrac(a + c, b * d))],
      explanation: `Multiply the tops and multiply the bottoms: ${fracExplanation(`\\frac{${a} \\times ${c}}{${b} \\times ${d}}`, a * c, b * d)}.`,
    };
  },
  (rng) => {
    const p = rng.int(2, 9);
    let q = rng.int(2, 12);
    if (q === p) q += 1;
    return {
      skillId: "fraction-ops",
      key: `recip-${p}-${q}`,
      prompt: `What is ${m(`\\frac{1}{${p}} + \\frac{1}{${q}}`)}?`,
      correct: m(texFrac(p + q, p * q)),
      distractors: [
        { text: m(texFrac(2, p + q)), misconceptionId: "add-across" },
        { text: m(texFrac(1, p + q)), misconceptionId: "add-across" },
      ],
      fillers: [m(texFrac(1, p * q)), m(texFrac(2, p * q))],
      explanation: `Use the common denominator ${p * q}: ${fracExplanation(
        `\\frac{1}{${p}} + \\frac{1}{${q}} = \\frac{${q}}{${p * q}} + \\frac{${p}}{${p * q}}`,
        p + q,
        p * q,
      )}.`,
    };
  },
  (rng) => {
    let a = 1;
    let b = 2;
    let c = 1;
    let d = 3;
    do {
      b = rng.int(2, 8);
      d = rng.int(2, 8);
      a = rng.int(1, b - 1);
      c = rng.int(1, d - 1);
    } while (b === d || a * d <= c * b || a === c);
    const n = a * d - c * b;
    return {
      skillId: "fraction-ops",
      key: `sub-${a}-${b}-${c}-${d}`,
      prompt: `What is ${m(`\\frac{${a}}{${b}} - \\frac{${c}}{${d}}`)}?`,
      correct: m(texFrac(n, b * d)),
      distractors: [{ text: m(texFrac(a - c, b - d)), misconceptionId: "add-across" }],
      fillers: [m(texFrac(a - c, b * d)), m(texFrac(n, b + d)), m(texFrac(a * d + c * b, b * d))],
      explanation: `Make the denominators equal, then subtract the tops: ${fracExplanation(
        `\\frac{${a * d}}{${b * d}} - \\frac{${c * b}}{${b * d}}`,
        n,
        b * d,
      )}.`,
    };
  },
];

export const decimals: Generator[] = [
  (rng) => {
    const x = rng.int(3, 8);
    const big = `0.${x}`;
    const two = `0.${x - 1}${rng.int(1, 9)}`;
    const three = `0.${x - 1}${rng.int(0, 9)}${rng.int(1, 9)}`;
    const small = `0.${Math.max(1, x - 2)}`;
    return {
      skillId: "decimals",
      key: `largest-${big}-${two}-${three}`,
      prompt: "Which of these numbers is the largest?",
      correct: m(big),
      distractors: [
        { text: m(three), misconceptionId: "longer-is-larger" },
        { text: m(two), misconceptionId: "longer-is-larger" },
      ],
      fillers: [m(small), m(`0.0${x}${x}`)],
      explanation: `Compare digit by digit from the left. In the tenths place ${x} beats ${x - 1}, so ${m(big)} is the largest. Extra digits don't make a decimal bigger: ${m(`${big} = ${big}00`)}.`,
    };
  },
  (rng) => {
    let a = 2;
    let b = 2;
    do {
      a = rng.int(2, 9);
      b = rng.int(2, 9);
    } while ((a * b) % 10 === 0);
    const prod = a * b;
    return {
      skillId: "decimals",
      key: `mul-${a}-${b}`,
      prompt: `What is ${m(`0.${a} \\times 0.${b}`)}?`,
      correct: m(dec(prod / 100, 4)),
      distractors: [
        { text: m(dec(prod / 10, 3)), misconceptionId: "decimal-places" },
        { text: m(dec(prod / 1000, 4)), misconceptionId: "decimal-places" },
      ],
      fillers: [m(dec((a + b) / 10, 2)), m(dec(prod, 0))],
      explanation: `${m(`${a} \\times ${b} = ${prod}`)}. The question has 1 + 1 = 2 decimal places, so the answer has 2: ${m(dec(prod / 100, 4))}.`,
    };
  },
  (rng) => {
    const a = rng.pick([6, 7, 8, 9]);
    const b = rng.int(2, 9);
    return {
      skillId: "decimals",
      key: `estimate-${a}-${b}`,
      prompt: `Without calculating, ${m(`0.${a} \\times 0.${b}`)} is…`,
      correct: `less than ${m(`0.${a}`)}`,
      distractors: [
        { text: `greater than ${m(`0.${a}`)}`, misconceptionId: "multiply-makes-bigger" },
        { text: `greater than ${m(1)}`, misconceptionId: "multiply-makes-bigger" },
      ],
      fillers: [`exactly ${m(`0.${a}`)}`],
      explanation: `Multiplying by a number less than 1 (here ${m(`0.${b}`)}) takes only part of ${m(`0.${a}`)}, so the answer is smaller: ${m(`0.${a} \\times 0.${b} = ${dec((a * b) / 100, 4)}`)}.`,
    };
  },
  (rng) => {
    const [n, d] = rng.pick([
      [1, 4],
      [3, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [1, 8],
      [3, 8],
      [1, 2],
      [7, 20],
    ] as const);
    return {
      skillId: "decimals",
      key: `frac-to-dec-${n}-${d}`,
      prompt: `Write ${m(`\\frac{${n}}{${d}}`)} as a decimal.`,
      correct: m(dec(n / d, 4)),
      distractors: [
        { text: m(`${n}.${d}`), misconceptionId: "fraction-as-digits" },
        { text: m(`0.${n}${d}`), misconceptionId: "fraction-as-digits" },
      ],
      fillers: [m(dec(d / n, 2)), m(dec(n / d + 0.1, 4))],
      explanation: `${m(`\\frac{${n}}{${d}}`)} means ${m(`${n} \\div ${d}`)}, which is ${m(dec(n / d, 4))}.`,
    };
  },
];

const ITEMS = ["pens", "notebooks", "erasers", "mangoes", "samosas"];

export const ratio: Generator[] = [
  (rng) => {
    const k = rng.int(2, 15);
    const n1 = rng.int(2, 6);
    const n2 = n1 + rng.int(1, 6);
    const item = rng.pick(ITEMS);
    const P = k * n1;
    const ans = k * n2;
    return {
      skillId: "ratio",
      key: `unitary-${k}-${n1}-${n2}`,
      prompt: `${n1} ${item} cost ₹${P}. At the same rate, how much do ${n2} ${item} cost?`,
      correct: `₹${ans}`,
      distractors: [{ text: `₹${P + (n2 - n1)}`, misconceptionId: "additive-reasoning" }],
      fillers: [`₹${P * (n2 - n1)}`, `₹${ans + k}`, `₹${P + n2}`],
      explanation: `Find the cost of one first: ₹${P} ÷ ${n1} = ₹${k}. Then ${n2} × ₹${k} = ₹${ans}. Adding ${n2 - n1} to the price doesn't keep the rate the same; scaling does.`,
    };
  },
  (rng) => {
    const a = rng.int(1, 5);
    let b = rng.int(1, 6);
    if (b === a) b += 1;
    const u = rng.int(2, 20) * 10;
    const T = (a + b) * u;
    return {
      skillId: "ratio",
      key: `share-${a}-${b}-${u}`,
      prompt: `₹${T} is shared between Meena and Kiran in the ratio ${a} : ${b}. How much does Meena get?`,
      correct: `₹${a * u}`,
      distractors: [
        { text: `₹${b * u}`, misconceptionId: "ratio-order" },
        { text: `₹${dec((T * a) / b, 2)}`, misconceptionId: "part-whole" },
      ],
      fillers: [`₹${T / 2}`, `₹${T - u}`],
      explanation: `There are ${a} + ${b} = ${a + b} equal parts, so one part is ₹${T} ÷ ${a + b} = ₹${u}. Meena gets ${a} part${a > 1 ? "s" : ""}: ₹${a * u}.`,
    };
  },
  (rng) => {
    let a = 1;
    let b = 2;
    do {
      a = rng.int(1, 7);
      b = rng.int(1, 7);
    } while (a === b || gcd(a, b) !== 1);
    return {
      skillId: "ratio",
      key: `part-whole-${a}-${b}`,
      prompt: `In a class, the ratio of boys to girls is ${a} : ${b}. What fraction of the class are boys?`,
      correct: m(texFrac(a, a + b)),
      distractors: [
        { text: m(texFrac(a, b)), misconceptionId: "part-whole" },
        { text: m(texFrac(b, a + b)), misconceptionId: "ratio-order" },
      ],
      fillers: [m(texFrac(b, a)), m(texFrac(1, a + b))],
      explanation: `Out of every ${a + b} students, ${a} are boys, so the fraction is ${m(texFrac(a, a + b))}. The ratio ${a} : ${b} compares boys with girls, not boys with the whole class.`,
    };
  },
  (rng) => {
    let r = 2;
    let p = 2;
    do {
      r = rng.int(2, 5);
      p = rng.int(2, 4);
    } while (r === p);
    const mult = rng.int(2, 4);
    const q = p * mult;
    return {
      skillId: "ratio",
      key: `recipe-${r}-${p}-${q}`,
      prompt: `A recipe uses ${r} cups of rice for ${p} people. How many cups are needed for ${q} people?`,
      correct: `${r * mult} cups`,
      distractors: [{ text: `${r + (q - p)} cups`, misconceptionId: "additive-reasoning" }],
      fillers: [`${r * q} cups`, `${r * mult + 1} cups`, `${q} cups`],
      explanation: `${q} people is ${mult} times as many as ${p}, so you need ${mult} times the rice: ${mult} × ${r} = ${r * mult} cups.`,
    };
  },
];

export const directInverse: Generator[] = [
  (rng) => {
    const w1 = rng.pick([2, 3, 4, 5, 6]);
    const d1 = rng.pick([4, 6, 8, 10, 12, 15]);
    const total = w1 * d1;
    const options = [];
    for (let w = 2; w <= 30; w++) if (w !== w1 && total % w === 0) options.push(w);
    const w2 = rng.pick(options);
    const ans = total / w2;
    return {
      skillId: "direct-inverse",
      key: `workers-${w1}-${d1}-${w2}`,
      prompt: `${w1} workers can build a wall in ${d1} days. How many days would ${w2} workers take, working at the same rate?`,
      correct: `${ans} days`,
      distractors: [{ text: `${dec((d1 * w2) / w1, 2)} days`, misconceptionId: "direct-inverse-mixup" }],
      fillers: [`${total} days`, `${ans + 2} days`, `${d1 * 2} days`],
      explanation: `More workers finish sooner, so this is inverse proportion: workers × days stays the same. ${w1} × ${d1} = ${total} worker-days, so ${w2} workers need ${total} ÷ ${w2} = ${ans} days.`,
    };
  },
  (rng) => {
    const s1 = rng.pick([30, 40, 60]);
    const t1 = rng.pick([2, 3, 4, 6]);
    const dist = s1 * t1;
    const choices = [20, 24, 30, 40, 45, 48, 60, 72, 80, 90, 120].filter((s) => s !== s1 && dist % s === 0);
    const s2 = rng.pick(choices);
    const ans = dist / s2;
    return {
      skillId: "direct-inverse",
      key: `speed-${s1}-${t1}-${s2}`,
      prompt: `At ${s1} km/h a journey takes ${t1} hours. How long does the same journey take at ${s2} km/h?`,
      correct: `${dec(ans, 2)} hours`,
      distractors: [{ text: `${dec((t1 * s2) / s1, 2)} hours`, misconceptionId: "direct-inverse-mixup" }],
      fillers: [`${t1 * 2} hours`, `${dec(ans + 1, 2)} hours`, `${t1} hours`],
      explanation: `The distance is fixed (${s1} × ${t1} = ${dist} km), so a faster speed means less time: inverse proportion. Time = ${dist} ÷ ${s2} = ${dec(ans, 2)} hours.`,
    };
  },
  (rng) => {
    const t1 = rng.pick([2, 3, 4]);
    const h1 = rng.pick([6, 8, 12]);
    const t2 = t1 * 2;
    const ans = (t1 * h1) / t2;
    return {
      skillId: "direct-inverse",
      key: `taps-${t1}-${h1}`,
      prompt: `${t1} identical taps fill a tank in ${h1} hours. How long would ${t2} such taps take?`,
      correct: `${dec(ans, 2)} hours`,
      distractors: [{ text: `${h1 * 2} hours`, misconceptionId: "direct-inverse-mixup" }],
      fillers: [`${h1} hours`, `${h1 + t1} hours`, `${dec(ans + 1, 2)} hours`],
      explanation: `Twice as many taps fill the tank in half the time (inverse proportion): ${m(`\\frac{${t1} \\times ${h1}}{${t2}} = ${dec(ans, 2)}`)} hours.`,
    };
  },
];

export const exponents: Generator[] = [
  (rng) => {
    const b = rng.pick(["2", "3", "5", "a", "x"]);
    const p = rng.int(2, 6);
    let q = rng.int(2, 6);
    if (p === 2 && q === 2) q = 3;
    return {
      skillId: "exponents",
      key: `product-${b}-${p}-${q}`,
      prompt: `Simplify ${m(`${b}^{${p}} \\times ${b}^{${q}}`)}.`,
      correct: m(`${b}^{${p + q}}`),
      distractors: [{ text: m(`${b}^{${p * q}}`), misconceptionId: "exponent-rules-mixed" }],
      fillers: [m(`${b}^{${p + q + 1}}`), m(`${b}^{${p}}`), m(`2 \\cdot ${b}^{${p + q}}`)],
      explanation: `Same base, multiplying, so add the powers: ${m(`${b}^{${p}} \\times ${b}^{${q}} = ${b}^{${p} + ${q}} = ${b}^{${p + q}}`)}. Written out, ${p} copies of ${m(b)} times ${q} more copies is ${p + q} copies.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 5);
    const n = rng.int(3, 4);
    const ans = a ** n;
    return {
      skillId: "exponents",
      key: `eval-${a}-${n}`,
      prompt: `What is ${m(`${a}^{${n}}`)}?`,
      correct: m(ans),
      distractors: [{ text: m(a * n), misconceptionId: "base-times-power" }],
      fillers: [m(a + n), m(a ** (n - 1)), m(ans + a)],
      explanation: `${m(`${a}^{${n}}`)} means ${n} copies of ${a} multiplied together: ${m(`${Array(n).fill(a).join(" \\times ")} = ${ans}`)}. It is not ${m(`${a} \\times ${n}`)}.`,
    };
  },
  (rng) => {
    const k = rng.int(2, 99);
    return {
      skillId: "exponents",
      key: `zero-${k}`,
      prompt: `What is ${m(`${k}^{0}`)}?`,
      correct: m(1),
      distractors: [
        { text: m(0), misconceptionId: "zero-power" },
        { text: m(k), misconceptionId: "zero-power" },
      ],
      fillers: [m(`\\frac{1}{${k}}`)],
      explanation: `Any non-zero number to the power 0 is 1. One way to see it: ${m(`\\frac{${k}^{3}}{${k}^{3}} = ${k}^{3-3} = ${k}^{0}`)}, and anything divided by itself is 1.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 5);
    const n = rng.int(2, 3);
    const v = a ** n;
    return {
      skillId: "exponents",
      key: `negative-${a}-${n}`,
      prompt: `What is ${m(`${a}^{-${n}}`)}?`,
      correct: m(`\\frac{1}{${v}}`),
      distractors: [
        { text: m(-v), misconceptionId: "negative-power" },
        { text: m(`-\\frac{1}{${v}}`), misconceptionId: "negative-power" },
      ],
      fillers: [m(v), m(-a * n)],
      explanation: `A negative power means "one over": ${m(`${a}^{-${n}} = \\frac{1}{${a}^{${n}}} = \\frac{1}{${v}}`)}. The answer is still positive.`,
    };
  },
  (rng) => {
    const b = rng.pick(["2", "3", "x", "y"]);
    const p = rng.int(2, 5);
    let q = rng.int(2, 4);
    if (p === 2 && q === 2) q = 3;
    return {
      skillId: "exponents",
      key: `power-of-power-${b}-${p}-${q}`,
      prompt: `Simplify ${m(`(${b}^{${p}})^{${q}}`)}.`,
      correct: m(`${b}^{${p * q}}`),
      distractors: [{ text: m(`${b}^{${p + q}}`), misconceptionId: "exponent-rules-mixed" }],
      fillers: [m(`${q}${b}^{${p}}`), m(`${b}^{${p * q + 1}}`), m(`${b}^{${p}}`)],
      explanation: `A power of a power multiplies the powers: ${m(`(${b}^{${p}})^{${q}} = ${b}^{${p} \\times ${q}} = ${b}^{${p * q}}`)}. You are multiplying ${q} copies of ${m(`${b}^{${p}}`)}.`,
    };
  },
];

export const sciNotation: Generator[] = [
  (rng) => {
    const d1 = rng.int(1, 9);
    const d2 = rng.int(1, 9);
    const k = rng.int(1, 4);
    const num = `0.${"0".repeat(k)}${d1}${d2}`;
    const correct = m(`${d1}.${d2} \\times 10^{-${k + 1}}`);
    return {
      skillId: "sci-notation",
      key: `small-${num}`,
      prompt: `Write ${m(num)} in standard form.`,
      correct,
      distractors: [
        { text: m(`${d1}.${d2} \\times 10^{${k + 1}}`), misconceptionId: "exponent-sign" },
        { text: m(`${d1}.${d2} \\times 10^{-${k}}`), misconceptionId: "count-zeros" },
      ],
      fillers: [m(`${d1}${d2} \\times 10^{-${k + 1}}`), m(`${d1}.${d2} \\times 10^{-${k + 2}}`)],
      explanation: `Move the decimal point right until one non-zero digit is in front: ${m(num)} becomes ${m(`${d1}.${d2}`)} after ${k + 1} places. Moving right for a small number gives a negative power: ${correct}.`,
    };
  },
  (rng) => {
    const d1 = rng.int(1, 9);
    const d2 = rng.int(1, 9);
    const k = rng.int(2, 6);
    const num = `${d1}${d2}${"0".repeat(k)}`;
    const correct = m(`${d1}.${d2} \\times 10^{${k + 1}}`);
    return {
      skillId: "sci-notation",
      key: `large-${num}`,
      prompt: `Write ${m(num)} in standard form.`,
      correct,
      distractors: [
        { text: m(`${d1}.${d2} \\times 10^{${k}}`), misconceptionId: "count-zeros" },
        { text: m(`${d1}.${d2} \\times 10^{-${k + 1}}`), misconceptionId: "exponent-sign" },
      ],
      fillers: [m(`${d1}${d2} \\times 10^{${k + 1}}`), m(`${d1}.${d2} \\times 10^{${k + 2}}`)],
      explanation: `Count the places the decimal point moves to leave one digit in front: ${m(num)} → ${m(`${d1}.${d2}`)} is ${k + 1} places (not just the ${k} zeros), so ${correct}.`,
    };
  },
  (rng) => {
    const a = rng.int(1, 3);
    const b = rng.int(2, 3);
    const p = rng.int(2, 6);
    let q = rng.int(2, 6);
    if (p === 2 && q === 2) q = 3;
    const correct = m(`${a * b} \\times 10^{${p + q}}`);
    return {
      skillId: "sci-notation",
      key: `multiply-${a}-${b}-${p}-${q}`,
      prompt: `What is ${m(`(${a} \\times 10^{${p}}) \\times (${b} \\times 10^{${q}})`)}?`,
      correct,
      distractors: [{ text: m(`${a * b} \\times 10^{${p * q}}`), misconceptionId: "power-arithmetic" }],
      fillers: [
        m(`${a + b} \\times 10^{${p + q}}`),
        m(`${a * b} \\times 10^{${Math.abs(p - q)}}`),
        m(`${a * b} \\times 10^{${p + q + 1}}`),
      ],
      explanation: `Multiply the numbers (${a} × ${b} = ${a * b}) and add the powers of 10 (${p} + ${q} = ${p + q}): ${correct}.`,
    };
  },
];
