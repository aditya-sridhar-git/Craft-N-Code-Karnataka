import { describe, expect, it } from "vitest";
import { atomCounts, molarMass, parseFormula, totalAtoms } from "@/shared/questions/generators/chemistry";
import { fixLatex, stripLead, stripNumbering } from "@/backend/ai/clean";
import { plainMath } from "@/shared/plain";
import { dec, simplify, texFrac } from "@/shared/questions/fmt";
import { createRng } from "@/shared/questions/rng";

describe("chemical formula parser", () => {
  it("counts atoms through brackets", () => {
    expect(atomCounts("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(atomCounts("Al2(SO4)3")).toEqual({ Al: 2, S: 3, O: 12 });
    expect(atomCounts("(NH4)2SO4")).toEqual({ N: 2, H: 8, S: 1, O: 4 });
    expect(atomCounts("C2H5OH")).toEqual({ C: 2, H: 6, O: 1 });
    expect(totalAtoms("H2SO4")).toBe(7);
  });

  it("reproduces the two classic counting mistakes", () => {
    expect(totalAtoms("Ca(OH)2", "bracket-last-only")).toBe(4);
    expect(molarMass("CO2", "ignore-subscripts")).toBe(28);
    expect(molarMass("Ca(OH)2", "bracket-last-only")).toBe(58);
  });

  it("computes molar masses", () => {
    expect(molarMass("H2O")).toBe(18);
    expect(molarMass("NaCl")).toBe(58.5);
    expect(molarMass("Al2(SO4)3")).toBe(342);
  });

  it("rejects what it can't read", () => {
    expect(() => parseFormula("Xy2")).toThrow();
    expect(() => parseFormula("Ca(OH")).toThrow();
    expect(() => parseFormula("H2O!")).toThrow();
  });
});

describe("formatting", () => {
  it("simplifies fractions with the sign on top", () => {
    expect(simplify(6, -8)).toEqual([-3, 4]);
    expect(texFrac(10, 12)).toBe("\\frac{5}{6}");
    expect(texFrac(-4, 2)).toBe("-2");
    expect(texFrac(3, -9)).toBe("-\\frac{1}{3}");
  });

  it("rounds decimals without float noise", () => {
    expect(dec(0.1 + 0.2)).toBe("0.3");
    expect(dec(3 * 0.02, 4)).toBe("0.06");
    expect(dec(-0.0001)).toBe("0");
  });
});

describe("plain-text maths for accessible names", () => {
  it("reads common LaTeX aloud sensibly", () => {
    expect(plainMath("$\\frac{3}{5}$")).toBe("3/5");
    expect(plainMath("$x = \\frac{v - u}{t}$")).toBe("x = (v - u)/t");
    expect(plainMath("$20\\sqrt{3}$ m")).toBe("20√3 m");
    expect(plainMath("$\\sin 30^\\circ$")).toBe("sin 30°");
    expect(plainMath("$\\mathrm{H_2SO_4}$")).toBe("H2SO4");
    expect(plainMath("₹20")).toBe("₹20");
  });
});

describe("repairing LaTeX from AI output", () => {
  it("restores backslashes that JSON decoding turned into control characters", () => {
    expect(fixLatex("$3 \times 4$")).toBe("$3 \\times 4$");
    expect(fixLatex("$\frac{1}{2}$")).toBe("$\\frac{1}{2}$");
    expect(fixLatex("$\theta$ and $\rho$")).toBe("$\\theta$ and $\\rho$");
    expect(fixLatex("$a \neq b$")).toBe("$a \\neq b$");
  });
  it("keeps real newlines and turns stray LaTeX outside maths into plain symbols", () => {
    expect(fixLatex("First paragraph.\n\nSecond.")).toBe("First paragraph.\n\nSecond.");
    expect(fixLatex("The AP 2, 5, 8, \\dots")).toBe("The AP 2, 5, 8, …");
    expect(fixLatex("Use 3 \\times 4 here, and $\\times$ there")).toBe("Use 3 × 4 here, and $\\times$ there");
  });
  it("wraps LaTeX the model wrote without $ signs, keeping punctuation outside", () => {
    expect(fixLatex("in the ratio 1 : \\sqrt{3} : 2")).toBe("in the ratio 1 : $\\sqrt{3}$ : 2");
    expect(fixLatex("So \\sin 30° = 1/2, \\cos 30° = \\sqrt{3}/2, and")).toBe("So $\\sin$ 30° = 1/2, $\\cos$ 30° = $\\sqrt{3}/2$, and");
    expect(fixLatex("(that is, \\frac{1}{2})")).toBe("(that is, $\\frac{1}{2}$)");
    expect(fixLatex("Already fine: $\\sqrt{2}$.")).toBe("Already fine: $\\sqrt{2}$.");
  });

  it("tidies numbered steps and repeated labels", () => {
    expect(stripNumbering("1. Identify a")).toBe("Identify a");
    expect(stripNumbering("Step 2: Use the formula")).toBe("Use the formula");
    expect(stripLead("Remember: add d each time", "Remember:")).toBe("add d each time");
  });
});

describe("seeded rng", () => {
  it("is reproducible", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.int(1, 100))).toEqual(Array.from({ length: 5 }, () => b.int(1, 100)));
  });
});
