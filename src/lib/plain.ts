/** Readable plain text for text containing $LaTeX$ — used for accessible names (aria-label). */
export function plainMath(text: string): string {
  return text
    .replace(/\$([^$]*)\$/g, (_, tex: string) => texToText(tex))
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function texToText(tex: string): string {
  let t = tex;
  for (let i = 0; i < 4; i++) {
    t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a: string, b: string) => `${wrap(a)}/${wrap(b)}`);
    t = t.replace(/\\sqrt\{([^{}]*)\}/g, (_, a: string) => `√${wrap(a)}`);
  }
  return t
    .replace(/\\(?:mathrm|text|mathbf)\{([^{}]*)\}/g, "$1")
    .replace(/_\{([^{}]*)\}/g, "$1")
    .replace(/_(\w)/g, "$1")
    .replace(/\^\{\\circ\}|\^\\circ/g, "°")
    .replace(/\^\{([^{}]*)\}/g, "^$1")
    .replace(/\\times/g, " × ")
    .replace(/\\div/g, " ÷ ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\pm/g, "±")
    .replace(/\\ne/g, " ≠ ")
    .replace(/\\le/g, " ≤ ")
    .replace(/\\ge/g, " ≥ ")
    .replace(/\\Rightarrow/g, " ⇒ ")
    .replace(/\\theta/g, "θ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\angle\s*/g, "angle ")
    .replace(/\\(sin|cos|tan)\b/g, "$1 ")
    .replace(/\\,|\\ /g, " ")
    .replace(/\\/g, "")
    .replace(/[{}]/g, "");
}

const wrap = (s: string) => (/^[\w.√°]+$/.test(s.trim()) ? s.trim() : `(${s.trim()})`);
