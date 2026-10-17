import { describe, expect, it } from "vitest";
import { atomCounts, molarMass, parseFormula, totalAtoms } from "@/lib/questions/generators/chemistry";
import { dec, simplify, texFrac } from "@/lib/questions/fmt";
import { createRng } from "@/lib/questions/rng";

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

describe("seeded rng", () => {
  it("is reproducible", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.int(1, 100))).toEqual(Array.from({ length: 5 }, () => b.int(1, 100)));
  });
});
