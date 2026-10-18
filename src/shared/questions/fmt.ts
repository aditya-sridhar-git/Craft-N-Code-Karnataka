/** Formatting helpers for generated questions. All math is written as inline LaTeX ($...$). */

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export function simplify(n: number, d: number): [number, number] {
  if (d === 0) throw new Error("zero denominator");
  const g = gcd(n, d);
  let sn = n / g;
  let sd = d / g;
  if (sd < 0) {
    sn = -sn;
    sd = -sd;
  }
  return [sn, sd];
}

/** LaTeX for the simplified fraction n/d ("3", "\frac{5}{6}", "-\frac{1}{2}"). */
export function texFrac(n: number, d: number): string {
  const [a, b] = simplify(n, d);
  if (b === 1) return `${a}`;
  return a < 0 ? `-\\frac{${-a}}{${b}}` : `\\frac{${a}}{${b}}`;
}

/** Wrap LaTeX as inline math. */
export const m = (tex: string | number) => `$${tex}$`;

/** Round to at most `dp` decimal places and drop trailing zeros. */
export function dec(x: number, dp = 2): string {
  const r = Math.round(x * 10 ** dp) / 10 ** dp;
  return Object.is(r, -0) ? "0" : String(r);
}

/** "+ 3" / "- 3" for building expressions like x + 3 or x - 3. */
export const signed = (k: number) => (k < 0 ? `- ${-k}` : `+ ${k}`);

/** Linear factor "(x + 3)" / "(x - 3)". */
export const factor = (k: number, v = "x") => `(${v} ${signed(k)})`;

/** a·√b in LaTeX, e.g. surd(10, 3) = "10\sqrt{3}", surd(1, 2) = "\sqrt{2}". */
export const surd = (a: number, b: number) => (a === 1 ? `\\sqrt{${b}}` : `${a}\\sqrt{${b}}`);
