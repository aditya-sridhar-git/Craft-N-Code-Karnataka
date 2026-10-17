"use client";

import { useEffect, useId, useRef } from "react";
import type { Question } from "@/lib/types";
import { reportIssueUrl } from "@/lib/site";
import { MathText } from "./MathText";

const LETTERS = ["A", "B", "C", "D"];

export function QuestionCard({
  question,
  label,
  onAnswer,
  feedback = null,
  disabled = false,
}: {
  question: Question;
  /** e.g. "Question 5" */
  label?: string;
  onAnswer: (choice: number | null) => void;
  /** Practice mode: once answered, show which option was right. */
  feedback?: { chosen: number | null } | null;
  disabled?: boolean;
}) {
  const promptId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const locked = disabled || feedback !== null;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [question.id]);

  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) {
        e.preventDefault();
        onAnswer(n - 1);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onAnswer(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, onAnswer, question.options.length]);

  const correctIndex = question.options.findIndex((o) => o.correct);

  return (
    <section className="rise rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7" aria-labelledby={promptId}>
      {label && <p className="mb-2 text-sm font-semibold text-muted">{label}</p>}
      <h2 id={promptId} ref={heading} tabIndex={-1} className="text-lg leading-relaxed font-semibold text-ink outline-none sm:text-xl">
        <MathText text={question.prompt} />
      </h2>

      <div role="group" aria-labelledby={promptId} className="mt-5 grid gap-2.5">
        {question.options.map((o, i) => {
          const isChosen = feedback?.chosen === i;
          const showRight = feedback && i === correctIndex;
          const showWrong = feedback && isChosen && !o.correct;
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => onAnswer(i)}
              aria-keyshortcuts={String(i + 1)}
              className={[
                "group flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors",
                showRight
                  ? "border-ok bg-ok-soft"
                  : showWrong
                    ? "border-gap bg-gap-soft"
                    : "border-line bg-paper enabled:hover:border-leaf enabled:hover:bg-leaf-soft",
                locked && !showRight && !showWrong ? "opacity-70" : "",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
                  showRight ? "border-ok bg-ok text-surface" : showWrong ? "border-gap bg-gap text-surface" : "border-line bg-surface text-muted group-enabled:group-hover:border-leaf group-enabled:group-hover:text-leaf",
                ].join(" ")}
              >
                {showRight ? "✓" : showWrong ? "✕" : LETTERS[i]}
              </span>
              <MathText text={o.text} className="flex-1" />
              {showRight && <span className="sr-only"> (correct answer)</span>}
              {showWrong && <span className="sr-only"> (your answer)</span>}
            </button>
          );
        })}
      </div>

      {!feedback && (
        <button
          type="button"
          disabled={locked}
          onClick={() => onAnswer(null)}
          aria-keyshortcuts="N"
          className="mt-3 w-full rounded-xl border border-dashed border-line px-4 py-3 text-base text-muted enabled:hover:border-soil enabled:hover:bg-soil-soft enabled:hover:text-ink"
        >
          I&apos;m not sure
        </button>
      )}

      {feedback && (
        <div role="status" className={`mt-4 rounded-xl p-4 ${feedback.chosen === correctIndex ? "bg-ok-soft" : "bg-surface-2"}`}>
          <p className="font-semibold">
            {feedback.chosen === correctIndex ? "✓ That's right." : feedback.chosen === null ? "Here's how to do it." : "Not quite. Here's how to do it."}
          </p>
          <MathText as="p" text={question.explanation} className="mt-1 leading-relaxed" />
        </div>
      )}

      <p className="mt-4 hidden text-xs text-muted sm:block">
        Keys: <kbd className="rounded border border-line px-1">1</kbd>–<kbd className="rounded border border-line px-1">4</kbd> to answer,{" "}
        <kbd className="rounded border border-line px-1">N</kbd> for not sure.
        {question.source === "ai" && (
          <>
            {" "}
            <a href={reportIssueUrl(question.id, question.prompt)} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Report a problem with this question
            </a>
          </>
        )}
      </p>
    </section>
  );
}
