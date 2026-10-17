"use client";

import Link from "next/link";
import { useState } from "react";
import type { DiagnosisResult, RootGap } from "@/lib/engine/diagnose";
import type { DiagnosticGraph } from "@/lib/engine/graph";
import type { AskedQuestion, PlanStep } from "@/lib/session";
import { encodeReport } from "@/lib/share";
import type { Subject } from "@/lib/types";
import { CONFIDENCE, displayStatus, formatDate, STATUS } from "@/lib/words";
import { MathText } from "./MathText";
import { RootTree, TreeLegend, TreeList } from "./RootTree";

export interface ReportViewProps {
  title: string;
  subject: Subject;
  grade: number;
  createdAt: number;
  graph: DiagnosticGraph;
  result: DiagnosisResult;
  asked?: AskedQuestion[];
  plan?: PlanStep[] | null;
  problemText?: string | null;
  /** Set for the student's own report: enables repair and sharing. */
  reportId?: string;
  shared?: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

function yearsBack(graph: DiagnosticGraph, root: RootGap, targetId: string) {
  const diff = graph.nodes[targetId].grade - graph.nodes[root.skillId].grade;
  return diff > 0 ? `${diff} year${diff === 1 ? "" : "s"} earlier` : null;
}

function summaryText(p: ReportViewProps) {
  const t = p.graph.nodes;
  const lines = [`Taproot check-up: ${p.title} (${formatDate(p.createdAt)})`];
  if (!p.result.roots.length) lines.push(p.result.targetMastered ? "No gap found: the check questions on this topic were answered correctly." : "No root gap could be confirmed.");
  for (const r of p.result.roots) {
    const s = t[r.skillId];
    const mis = r.misconceptions[0] ? s.misconceptions.find((m) => m.id === r.misconceptions[0].id) : null;
    lines.push(`Root gap: ${s.title} (Class ${s.grade}). ${r.total - r.correct} of ${r.total} answers missed${mis ? `; common mix-up: ${mis.label.toLowerCase()}` : ""}.`);
    lines.push(`Chain: ${r.path.map((id) => t[id].short).join(" → ")}`);
  }
  const solid = Object.keys(t).filter((id) => p.result.status[id] === "mastered").map((id) => t[id].short);
  if (solid.length) lines.push(`Solid: ${solid.join(", ")}`);
  lines.push("(A learning check-up, not a grade.)");
  return lines.join("\n");
}

export function ReportView(props: ReportViewProps) {
  const { graph, result, asked = [], plan, reportId, shared } = props;
  const [copied, setCopied] = useState<"summary" | "link" | "failed" | null>(null);
  const nodes = graph.nodes;
  const target = nodes[result.targetId];
  const roots = new Set(result.roots.map((r) => r.skillId));
  const main = result.roots[0];
  const affected = Object.keys(nodes).filter((id) => !roots.has(id) && (result.status[id] === "gap" || result.status[id] === "inferred-gap"));

  const copy = async (what: "summary" | "link") => {
    const text =
      what === "summary"
        ? summaryText(props)
        : `${window.location.origin}/r#${encodeReport({ title: props.title, subject: props.subject, grade: props.grade, createdAt: props.createdAt, graph, result })}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied("failed");
    }
  };

  return (
    <article className="space-y-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-soil uppercase">{shared ? "Shared check-up report" : "Your check-up report"}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{props.title}</h1>
        <p className="mt-2 text-muted">
          {formatDate(props.createdAt)} · {result.questionsAsked} questions · Class {props.grade}
        </p>
        {props.problemText && (
          <blockquote className="mt-4 rounded-xl border-l-4 border-soil bg-soil-soft p-4 text-[0.95rem]">
            <p className="text-sm font-semibold text-soil">The problem</p>
            <p className="mt-1 whitespace-pre-line">{props.problemText}</p>
          </blockquote>
        )}
      </header>

      {main ? (
        <section aria-labelledby="finding" className="rise rounded-3xl border-2 border-gap bg-surface p-6 shadow-sm sm:p-8">
          {main.skillId === result.targetId ? (
            <>
              <p className="text-sm font-semibold tracking-wide text-gap uppercase">Where the trouble is</p>
              <h2 id="finding" className="mt-1 font-display text-3xl font-semibold">
                Inside {target.title} itself
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed">
                The skills this chapter is built on look solid. The gap is in the chapter&apos;s own ideas, so that&apos;s the part to work on.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold tracking-wide text-gap uppercase">The root of the trouble</p>
              <h2 id="finding" className="mt-1 font-display text-3xl font-semibold">
                {nodes[main.skillId].title}
              </h2>
              <p className="mt-1 text-muted">
                {nodes[main.skillId].ref ? `Class ${nodes[main.skillId].ref!.cls} · ${nodes[main.skillId].ref!.topic}` : `About Class ${nodes[main.skillId].grade}`}
                {yearsBack(graph, main, result.targetId) && <> · {yearsBack(graph, main, result.targetId)}</>}
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed">
                You were stuck on <strong>{target.title}</strong>. Your answers trace the trouble back to{" "}
                <strong>{nodes[main.skillId].title.toLowerCase()}</strong>, which {target.title.toLowerCase()} is built on.
              </p>
            </>
          )}

          <ol aria-label="From the root gap up to your topic" className="mt-5 flex flex-wrap items-center gap-2">
            {main.path.map((id, i) => (
              <li key={id} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-sun-ink">
                    →
                  </span>
                )}
                <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${i === 0 ? "bg-gap text-surface" : i === main.path.length - 1 ? "bg-leaf-soft text-leaf" : "bg-surface-2"}`}>
                  {nodes[id].short}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-sm font-semibold text-muted">Evidence</p>
              <p className="mt-1">
                {main.correct} of {main.total} right on {nodes[main.skillId].short.toLowerCase()}
                {main.unsure > 0 && `, with ${main.unsure} "not sure"`}. {affected.length > 0 && `${affected.length} skill${affected.length === 1 ? "" : "s"} built on it ${affected.length === 1 ? "is" : "are"} affected too.`}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-sm font-semibold text-muted">
                Confidence: <span className="text-ink">{main.confidence}</span>
              </p>
              <p className="mt-1">{CONFIDENCE[main.confidence]}</p>
            </div>
          </div>

          {(() => {
            const top = main.misconceptions[0];
            const mis = top ? nodes[main.skillId].misconceptions.find((m) => m.id === top.id) : null;
            if (!mis) return null;
            return (
              <div className="mt-4 rounded-2xl border border-sun bg-sun-soft p-4">
                <p className="font-semibold">
                  Your answers match a common mix-up: <MathText text={mis.label.charAt(0).toLowerCase() + mis.label.slice(1)} />
                  {top.count > 1 && ` (${top.count} times)`}.
                </p>
                <MathText as="p" text={mis.fix} className="mt-2 leading-relaxed" />
              </div>
            );
          })()}

          {reportId && !shared && (
            <div className="no-print mt-6 flex flex-wrap items-center gap-3">
              <Link href={`/repair?id=${reportId}&skill=${main.skillId}`} className="rounded-xl bg-leaf px-6 py-3 text-lg font-semibold text-leaf-ink hover:opacity-95">
                Fix this root now
              </Link>
              <span className="text-sm text-muted">About 10 minutes: a short lesson, a worked example and practice, then climb back up to {target.short.toLowerCase()}.</span>
            </div>
          )}

          {result.roots.length > 1 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="font-semibold">There&apos;s another root to look at after this one:</p>
              <ul className="mt-2 space-y-2">
                {result.roots.slice(1).map((r) => (
                  <li key={r.skillId} className="flex flex-wrap items-center gap-3">
                    <span>
                      <strong>{nodes[r.skillId].title}</strong> <span className="text-muted">(Class {nodes[r.skillId].grade}, confidence {r.confidence})</span>
                    </span>
                    {reportId && !shared && (
                      <Link href={`/repair?id=${reportId}&skill=${r.skillId}`} className="no-print text-sm font-semibold text-leaf underline underline-offset-2">
                        Fix this one
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="finding" className="rise rounded-3xl border-2 border-ok bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold tracking-wide text-ok uppercase">{result.targetMastered ? "Good news" : "Not enough to go on"}</p>
          <h2 id="finding" className="mt-1 font-display text-3xl font-semibold">
            {result.targetMastered ? "No gap found" : "We couldn't pin down a root gap"}
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed">
            {result.targetMastered
              ? `You got the check questions on ${target.title.toLowerCase()} right, so the foundations look fine. If you still feel stuck, the trouble may be with longer exam-style problems or speed rather than a missing skill.`
              : "The check ended before there were enough answers. Try again and answer a few more questions; it usually takes 10 to 16."}
          </p>
          {!shared && (
            <Link href="/start" className="no-print mt-5 inline-block rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink">
              Check another topic
            </Link>
          )}
        </section>
      )}

      {plan && plan.length > 0 && (
        <section aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="font-display text-2xl font-semibold">
            What this problem needs
          </h2>
          <ol className="mt-3 space-y-2">
            {plan.map((p, i) => {
              const ds = displayStatus(p.skillId, result.status, roots);
              return (
                <li key={i} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
                  <span className="font-display text-lg font-semibold text-soil">{i + 1}</span>
                  <span className="flex-1">
                    <MathText text={p.step} />
                    <span className="mt-1 block text-sm text-muted">
                      Skill: {nodes[p.skillId]?.title ?? p.skillId} · {STATUS[ds].icon} {STATUS[ds].label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section aria-labelledby="tree-heading" className="print-break">
        <h2 id="tree-heading" className="font-display text-2xl font-semibold">
          Your skill tree
        </h2>
        <p className="mt-1 max-w-2xl text-muted">
          {target.title} grows from the skills underneath it. Taproot only asked about the ones it needed; the rest were worked out from your answers.
        </p>
        <div className="mt-4">
          <TreeLegend />
        </div>
        <div className="mt-4">
          <RootTree graph={graph} status={result.status} roots={roots} path={main?.path} />
        </div>
        <details className="mt-3 rounded-xl border border-line bg-surface p-4">
          <summary className="cursor-pointer font-semibold">Show the tree as a list</summary>
          <div className="mt-3">
            <TreeList graph={graph} status={result.status} roots={roots} />
          </div>
        </details>
      </section>

      {asked.length > 0 && (
        <section aria-labelledby="answers-heading">
          <h2 id="answers-heading" className="font-display text-2xl font-semibold">
            Every question, with the answers
          </h2>
          <ol className="mt-4 space-y-2">
            {asked.map((a, i) => {
              const right = a.question.options.find((o) => o.correct)!;
              return (
                <li key={a.question.id + i}>
                  <details className="rounded-xl border border-line bg-surface p-4">
                    <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-2">
                      <span aria-hidden="true" className={a.correct ? "font-bold text-ok" : "font-bold text-gap"}>
                        {a.correct ? "✓" : a.chosen === null ? "?" : "✕"}
                      </span>
                      <span className="sr-only">{a.correct ? "Correct." : a.chosen === null ? "Not sure." : "Not correct."}</span>
                      <span className="font-semibold">
                        {i + 1}. {nodes[a.question.skillId]?.short}
                      </span>
                      <MathText text={a.question.prompt} className="text-muted" />
                    </summary>
                    <div className="mt-3 space-y-1.5 text-[0.95rem]">
                      <p>
                        <span className="font-semibold">Your answer: </span>
                        {a.chosen === null ? "Not sure" : <MathText text={a.question.options[a.chosen].text} />}
                      </p>
                      {!a.correct && (
                        <p>
                          <span className="font-semibold">Answer: </span>
                          <MathText text={right.text} />
                        </p>
                      )}
                      <MathText as="p" text={a.question.explanation} className="leading-relaxed text-muted" />
                      {a.question.source === "ai" && <p className="text-xs text-muted">This question was written by AI and double-checked by a second AI model.</p>}
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {!shared && (
        <section aria-labelledby="next-heading" className="no-print rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 id="next-heading" className="font-display text-2xl font-semibold">
            Keep it, share it
          </h2>
          <p className="mt-1 text-muted">
            This report is saved on this device only. Come back around <strong>{formatDate(props.createdAt + 3 * DAY)}</strong> for a quick re-check: spacing practice out helps it stick.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="rounded-xl border border-line bg-paper px-4 py-2 font-semibold hover:bg-surface-2">
              Print or save as PDF
            </button>
            <button type="button" onClick={() => copy("link")} className="rounded-xl border border-line bg-paper px-4 py-2 font-semibold hover:bg-surface-2">
              Copy a link for your teacher
            </button>
            <button type="button" onClick={() => copy("summary")} className="rounded-xl border border-line bg-paper px-4 py-2 font-semibold hover:bg-surface-2">
              Copy a text summary
            </button>
            <Link href="/start" className="rounded-xl border border-line bg-paper px-4 py-2 font-semibold hover:bg-surface-2">
              Check another topic
            </Link>
          </div>
          <p role="status" className="mt-2 min-h-5 text-sm text-muted">
            {copied === "link" && "Link copied. It contains the result (not your answers) and works without an account."}
            {copied === "summary" && "Summary copied."}
            {copied === "failed" && "Couldn't copy automatically. Your browser blocked the clipboard."}
          </p>
        </section>
      )}
    </article>
  );
}
