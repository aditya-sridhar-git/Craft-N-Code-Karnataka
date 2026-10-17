import katex from "katex";
import { describe, expect, it } from "vitest";
import { BANK } from "@/data/bank";
import { SKILL_LIST } from "@/data/skills";
import { bankQuestion, GENERATORS } from "@/lib/questions";
import { buildMcq, DegenerateQuestion } from "@/lib/questions/mcq";
import { createRng } from "@/lib/questions/rng";

const SEEDS = 400;

/** Every $...$ segment must be valid LaTeX for KaTeX. */
function assertRenders(text: string, where: string) {
  const parts = text.split("$");
  expect(parts.length % 2, `${where}: unbalanced $ in "${text}"`).toBe(1);
  for (let i = 1; i < parts.length; i += 2) {
    expect(() => katex.renderToString(parts[i], { throwOnError: true, strict: "ignore" }), `${where}: ${parts[i]}`).not.toThrow();
  }
}

/** Numeric value of an answer like "$-\frac{3}{4}$", "₹20", "12 m/s", "$x = 5$". */
function value(text: string): number | null {
  const t = text.replace(/\$/g, "").replace(/₹/g, "").replace(/^x = /, "").trim();
  const frac = t.match(/^(-)?\\frac\{(\d+)\}\{(\d+)\}/);
  if (frac) return ((frac[1] ? -1 : 1) * Number(frac[2])) / Number(frac[3]);
  const num = t.match(/^-?\d+(\.\d+)?/);
  return num ? Number(num[0]) : null;
}

/** Value of an option that is only a number or a fraction, optionally followed by a unit ("₹20", "6 Ω"). */
function pureValue(text: string): number | null {
  const t = text
    .replace(/\$/g, "")
    .replace(/₹/g, "")
    .trim()
    .replace(/\s+[A-Za-zΩ²/]+$/, "");
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  const f = t.match(/^(-)?\\frac\{(\d+)\}\{(\d+)\}$/);
  return f ? ((f[1] ? -1 : 1) * Number(f[2])) / Number(f[3]) : null;
}

describe("generated questions", () => {
  for (const skill of SKILL_LIST) {
    it(`${skill.id}: 4 distinct options, exactly one correct, valid LaTeX`, () => {
      const rng = createRng(1234);
      let built = 0;
      for (const gen of GENERATORS[skill.id] ?? []) {
        for (let i = 0; i < SEEDS; i++) {
          const spec = gen(rng);
          let q;
          try {
            q = buildMcq(spec, rng);
          } catch (e) {
            if (e instanceof DegenerateQuestion) continue; // the pool retries these with new numbers
            throw e;
          }
          built++;
          expect(q.options).toHaveLength(4);
          expect(q.options.filter((o) => o.correct)).toHaveLength(1);
          const texts = q.options.map((o) => o.text.replace(/\s+/g, ""));
          expect(new Set(texts).size, `${q.id}: ${texts.join(" | ")}`).toBe(4);
          assertRenders(q.prompt, q.id);
          assertRenders(q.explanation, q.id);
          for (const o of q.options) assertRenders(o.text, q.id);
          // A wrong option must never have the same value as the right one (e.g. 1/2 vs 2/4).
          const right = pureValue(q.options.find((o) => o.correct)!.text);
          if (right !== null) {
            for (const o of q.options.filter((x) => !x.correct)) {
              const v = pureValue(o.text);
              if (v !== null) expect(Math.abs(v - right), `${q.id}: "${o.text}" equals the answer`).toBeGreaterThan(1e-9);
            }
          }
        }
      }
      expect(built, `${skill.id} built no questions`).toBeGreaterThan(0);
    });
  }

  it("bank questions are well formed", () => {
    const rng = createRng(5);
    for (const item of BANK) {
      const q = bankQuestion(item, rng);
      expect(q.options).toHaveLength(4);
      expect(q.options.filter((o) => o.correct)).toHaveLength(1);
      assertRenders(q.prompt, item.id);
      assertRenders(q.explanation, item.id);
      for (const o of q.options) assertRenders(o.text, item.id);
    }
  });
});

/** Recompute the right answer from the parameters encoded in the question key, independently of the generator. */
const ORACLES: Record<string, (args: number[]) => number> = {
  "integers/sub-neg": ([a, b]) => a + b,
  "integers/mul-neg": ([a, b]) => a * b,
  "integers/neg-plus": ([a, b]) => -a + b,
  "integers/neg-minus": ([a, b]) => -a - b,
  "bodmas/a+bc": ([a, b, c]) => a + b * c,
  "bodmas/a-b+c": ([a, b, c]) => a - b + c,
  "bodmas/a/b*c": ([a, b, c]) => (a / b) * c,
  "bodmas/a-bc": ([a, b, c]) => a - b * c,
  "bodmas/(a+b)c": ([a, b, c]) => (a + b) * c,
  "fraction-ops/add": ([a, b, c, d]) => a / b + c / d,
  "fraction-ops/sub": ([a, b, c, d]) => a / b - c / d,
  "fraction-ops/mul": ([a, b, c, d]) => (a / b) * (c / d),
  "fraction-ops/div": ([a, b, c, d]) => a / b / (c / d),
  "fraction-ops/recip": ([p, q]) => 1 / p + 1 / q,
  "decimals/mul": ([a, b]) => (a / 10) * (b / 10),
  "ratio/unitary": ([k, , n2]) => k * n2,
  "ratio/share": ([a, , u]) => a * u,
  "direct-inverse/workers": ([w1, d1, w2]) => (w1 * d1) / w2,
  "direct-inverse/speed": ([s1, t1, s2]) => (s1 * t1) / s2,
  "exponents/eval": ([a, n]) => a ** n,
  "exponents/zero": () => 1,
  "linear-equations/x+b": ([b, c]) => c - b,
  "linear-equations/ax+b": ([a, b, c]) => (c - b) / a,
  "linear-equations/a(x+b)": ([a, b, c]) => c / a - b,
  "linear-equations/x/a+b": ([a, b, c]) => a * (c - b),
  "identities/hundred": ([k]) => (100 + k) ** 2,
  "square-roots/root-sum": ([a, b]) => Math.sqrt(a * a + b * b),
  "square-roots/root": ([sq]) => Math.sqrt(sq),
  "square-roots/root-dec": ([d]) => d / 10,
  "pythagoras/hyp": ([a, b]) => Math.hypot(a, b),
  "pythagoras/leg": ([a, c]) => Math.sqrt(c * c - a * a),
  "units/kmh-ms": ([v]) => (v * 1000) / 3600,
  "units/ms-kmh": ([v]) => (v * 3600) / 1000,
  "units/ma-a": ([n]) => n / 1000,
  "units/cm2-m2": ([a]) => a / 10000,
  "units/g-kg": ([g]) => g / 1000,
  "acceleration/speed-up": ([, a]) => a,
  "acceleration/brake": ([u, v, t]) => (v - u) / t,
  "motion-equations/throw-up-v": ([u, t]) => u - 10 * t,
  "motion-equations/s-ut": ([u, a, t]) => u * t + 0.5 * a * t * t,
  "motion-equations/v2-2as": ([a, s]) => Math.sqrt(2 * a * s),
  "motion-equations/max-height": ([u]) => (u * u) / (2 * 10),
  "vectors/right-angle": ([a, b]) => Math.hypot(a, b),
  "components/other-component": ([a, c]) => Math.sqrt(c * c - a * a),
  "projectile/flight-time": ([u]) => (2 * u * Math.sin(Math.PI / 6)) / 10,
  "projectile/max-height": ([u]) => (u * Math.sin(Math.PI / 6)) ** 2 / (2 * 10),
  "projectile/range-45": ([u]) => (u * u * Math.sin(Math.PI / 2)) / 10,
  "current/i-q-t": ([Q, t]) => Q / t,
  "current/q-it": ([I, t]) => I * t,
  "ohms-law/find-i": ([, I]) => I,
  "ohms-law/find-r": ([R]) => R,
  "circuits/parallel": ([a, b]) => 1 / (1 / a + 1 / b),
  "circuits/three-equal": ([r]) => 1 / (3 / r),
  "circuits/mixed": ([a, b, c]) => a + 1 / (1 / b + 1 / c),
  "circuits/series-current": ([v, a, b]) => v / (a + b),
};

const MOLAR: Record<string, number> = {
  H2O: 18, CO2: 44, NH3: 17, CH4: 16, H2SO4: 98, CaCO3: 100, "Ca(OH)2": 74, "Mg(OH)2": 58, NaOH: 40,
  HNO3: 63, Na2CO3: 106, C6H12O6: 180, "Al2(SO4)3": 342, SO2: 64,
};
const ATOMS: Record<string, number> = {
  H2SO4: 7, CaCO3: 5, "Ca(OH)2": 5, "Al2(SO4)3": 17, C6H12O6: 24, NH4NO3: 9, "Mg(OH)2": 5, HNO3: 5, Na2CO3: 6, "(NH4)2SO4": 15, C2H5OH: 9,
};

describe("answers recomputed independently", () => {
  it("match the generators' answer keys", () => {
    const rng = createRng(99);
    let checked = 0;
    for (const [skillId, gens] of Object.entries(GENERATORS)) {
      for (const gen of gens) {
        for (let i = 0; i < 150; i++) {
          const spec = gen(rng);
          const got = value(spec.correct);
          if (skillId === "molar-mass") {
            const f = spec.key.replace("molar-", "");
            expect(got, spec.key).toBeCloseTo(MOLAR[f], 6);
            checked++;
            continue;
          }
          if (skillId === "formulas" && spec.key.startsWith("count-")) {
            expect(got, spec.key).toBe(ATOMS[spec.key.replace("count-", "")]);
            checked++;
            continue;
          }
          if (skillId === "moles" && spec.key.startsWith("n-from-m-")) {
            expect(got, spec.key).toBeCloseTo(Number(spec.key.split("-").pop()), 6);
            checked++;
            continue;
          }
          const match = Object.keys(ORACLES).find((k) => {
            const [sid, prefix] = k.split("/");
            return sid === skillId && spec.key.startsWith(`${prefix}-`) && /^-?\d/.test(spec.key.slice(prefix.length + 1));
          });
          if (!match) continue;
          const prefix = match.split("/")[1];
          const args = spec.key
            .slice(prefix.length + 1)
            .split("-")
            .map(Number);
          expect(got, `${spec.key}: "${spec.correct}"`).not.toBeNull();
          expect(got!, `${spec.key}: "${spec.correct}"`).toBeCloseTo(ORACLES[match](args), 1);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(3000);
  });
});
