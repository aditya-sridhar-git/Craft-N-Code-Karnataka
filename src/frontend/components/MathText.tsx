import katex from "katex";
import { Fragment, type ElementType } from "react";

const cache = new Map<string, string>();

function renderMath(tex: string, display: boolean) {
  const key = display ? `D${tex}` : tex;
  let html = cache.get(key);
  if (html === undefined) {
    // trust:false blocks \href, \html* and similar; text that comes from AI goes through here too.
    html = katex.renderToString(display ? `\\displaystyle ${tex}` : tex, {
      throwOnError: false,
      output: "htmlAndMathml",
      strict: "ignore",
      trust: false,
      maxExpand: 200,
      maxSize: 20,
    });
    if (cache.size > 2000) cache.clear();
    cache.set(key, html);
  }
  return html;
}

/** Plain text with **bold** and *italic*, escaped by React. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/**
 * Renders text containing $inline maths$ (KaTeX, with MathML for screen readers).
 * `display` typesets fractions at full size, which is easier to read in questions and answers.
 */
export function MathText({ text, as: Tag = "span", className, display = false }: { text: string; as?: ElementType; className?: string; display?: boolean }) {
  const parts = text.split("$");
  // An odd number of $ means a stray one: show the text as-is rather than guess.
  if (parts.length % 2 === 0) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag className={className}>
      {parts.map((p, i) =>
        i % 2 ? <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(p, display) }} /> : <Inline key={i} text={p} />,
      )}
    </Tag>
  );
}
