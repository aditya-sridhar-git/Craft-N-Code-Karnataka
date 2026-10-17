/**
 * Repairs LaTeX that went wrong on the way out of an LLM's JSON.
 *
 * A model that writes "\times" or "\frac" inside a JSON string without doubling the backslash
 * produces valid JSON whose decoded text contains a TAB ("\t" + "imes") or a form feed
 * ("\f" + "rac"). The same happens with \beta (backspace), \rho/\rightarrow (carriage return)
 * and \neq/\nu (newline). This turns those control characters back into backslashes, and turns
 * stray LaTeX written outside $...$ into plain characters.
 */
const CONTROL: Record<string, string> = { "\t": "t", "\f": "f", "\b": "b", "\r": "r", "\v": "v" };

const SYMBOL: Record<string, string> = {
  dots: "…",
  ldots: "…",
  cdots: "…",
  times: "×",
  cdot: "·",
  div: "÷",
  pm: "±",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  ne: "≠",
  neq: "≠",
  pi: "π",
  theta: "θ",
  circ: "°",
  degree: "°",
};

export function fixLatex(text: string): string {
  let out = text.replace(/[\t\f\b\r\v](?=[a-zA-Z])/g, (c) => `\\${CONTROL[c]}`);
  out = out
    .split("$")
    .map((part, i) =>
      i % 2
        ? // Inside maths a newline right before these letters was almost certainly \n of \neq, \nu, \nabla, \not.
          part.replace(/\n(?=(eq|e\b|u\b|abla|ot\b|leq|geq))/g, "\\n")
        : part.replace(/\\(dots|ldots|cdots|times|cdot|div|pm|leq?|geq?|neq?|pi|theta|circ|degree)\b/g, (_, cmd: string) => SYMBOL[cmd] ?? ""),
    )
    .join("$");
  return out;
}

/** "1. Do this" / "Step 2: Do that" → "Do this" (the list already numbers its items). */
export const stripNumbering = (s: string) => s.replace(/^\s*(?:step\s*\d+\s*[:.)-]?|\d+\s*[.):-])\s*/i, "");

/** Removes a leading label the UI adds itself, e.g. "Remember: ". */
export const stripLead = (s: string, ...labels: string[]) => {
  let out = s.trim();
  for (const l of labels) if (out.toLowerCase().startsWith(l.toLowerCase())) out = out.slice(l.length).trim();
  return out;
};
