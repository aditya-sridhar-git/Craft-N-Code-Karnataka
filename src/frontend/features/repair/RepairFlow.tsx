"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MathText } from "@/frontend/components/MathText";
import { QuestionCard } from "@/frontend/components/QuestionCard";
import { FEATURED } from "@/shared/data/topics";
import { fetchQuestions } from "@/frontend/lib/flow";
import { drawQuestion, hasCuratedQuestions } from "@/shared/questions";
import { createRng, freshSeed } from "@/shared/questions/rng";
import { featuredSession, newSession, reportsStore, saveReport, sessionStore, type Report } from "@/frontend/lib/session";
import { useStore } from "@/frontend/lib/store";
import type { Question, Skill } from "@/shared/types";
import { inSentence } from "@/shared/words";

interface Lesson {
  title: string;
  explanation: string;
  steps: string[];
  tip: string;
  source: "ai" | "curated";
}

type Step =
  | { kind: "learn" }
  | { kind: "example"; question: Question | null }
  | { kind: "practice"; questions: Question[]; i: number; chosen: (number | null)[]; revealed: boolean }
  | { kind: "result"; correct: number; total: number }
  | { kind: "done" };

function curatedLesson(skill: Skill, misconceptionId: string | null): Lesson {
  const mis = misconceptionId ? skill.misconceptions.find((m) => m.id === misconceptionId) : null;
  return {
    title: skill.title,
    explanation: mis ? `${mis.fix}\n\n${skill.lesson}` : skill.lesson,
    steps: [],
    tip: skill.summary,
    source: "curated",
  };
}

export function RepairFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const reports = useStore(reportsStore);
  const report = reports?.find((r) => r.id === params.get("id")) ?? null;
  const rootId = params.get("skill");
  const root = report?.result.roots.find((r) => r.skillId === rootId) ?? report?.result.roots[0] ?? null;

  const [stage, setStage] = useState(0);
  const [step, setStep] = useState<Step>({ kind: "learn" });
  const [fetched, setFetched] = useState<Record<string, Lesson>>({});
  const [lessonStyle, setLessonStyle] = useState<"first" | "another-way">("first");
  const [seed] = useState(() => freshSeed());
  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);

  const path = root?.path ?? [];
  const skillId = path[stage];
  const skill = skillId && report ? report.graph.nodes[skillId] : null;
  const isRoot = stage === 0;
  // The root gap (and any "explain it another way") gets an AI lesson; climbing stages use the curated one.
  const wantsAi = isRoot || lessonStyle === "another-way";
  const lessonKey = `${skillId}:${lessonStyle}`;
  const lesson: Lesson | null = !skill ? null : wantsAi ? (fetched[lessonKey] ?? null) : curatedLesson(skill, null);

  useEffect(() => {
    if (!report || !skill || step.kind !== "learn" || !wantsAi || fetched[lessonKey]) return;
    const fallback = curatedLesson(skill, isRoot ? (root?.misconceptions[0]?.id ?? null) : null);
    let live = true;
    const wrong = report.asked
      .filter((a) => a.question.skillId === skill.id && !a.correct)
      .slice(0, 3)
      .map((a) => ({
        prompt: a.question.prompt,
        chosen: a.chosen === null ? "I'm not sure" : a.question.options[a.chosen].text,
        answer: a.question.options.find((o) => o.correct)!.text,
      }));
    fetch("/api/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        skill: { id: skill.id, title: skill.title, summary: skill.summary, grade: skill.grade, subject: skill.subject, lesson: skill.lesson, misconceptions: skill.misconceptions },
        misconceptionId: root?.misconceptions[0]?.id ?? null,
        wrong,
        target: report.graph.nodes[report.result.targetId].title,
        path: path.map((id) => report.graph.nodes[id].title),
        grade: report.grade,
        style: lessonStyle,
        needSteps: Boolean(skill.generated),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Omit<Lesson, "source">;
        if (live) setFetched((f) => ({ ...f, [lessonKey]: { ...data, source: "ai" } }));
      })
      .catch(() => {
        if (live) setFetched((f) => ({ ...f, [lessonKey]: fallback }));
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, lessonKey, step.kind, wantsAi]);

  if (reports === undefined) return <p className="text-muted">Loading…</p>;
  if (!report || !root || !skill) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold">Nothing to repair here</h1>
        <p className="mt-2 text-muted">Open a report with a root gap first.</p>
        <Link href="/history" className="mt-4 inline-block rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
          My checks
        </Link>
      </div>
    );
  }

  const target = report.graph.nodes[report.result.targetId];
  const practiceSize = isRoot ? 3 : 2;

  async function questionsFor(s: Skill, n: number): Promise<Question[]> {
    const taken = new Set([...used, ...report!.asked.map((a) => a.question.id)]);
    if (!s.generated && hasCuratedQuestions(s.id)) {
      const out: Question[] = [];
      const rng = createRng(seed + 101 * (stage + 1) + taken.size);
      for (let i = 0; i < n; i++) {
        const q = drawQuestion(s.id, rng, new Set([...taken, ...out.map((x) => x.id)])) ?? drawQuestion(s.id, rng, new Set(out.map((x) => x.id)));
        if (q) out.push(q);
      }
      return out;
    }
    const pool = await fetchQuestions(s, report!.title);
    const fresh = pool.filter((q) => !taken.has(q.id));
    return (fresh.length >= n ? fresh : pool).slice(0, n);
  }

  async function startPractice() {
    setLoading(true);
    try {
      const questions = await questionsFor(skill!, practiceSize);
      setUsed((u) => new Set([...u, ...questions.map((q) => q.id)]));
      setStep(questions.length ? { kind: "practice", questions, i: 0, chosen: [], revealed: false } : { kind: "result", correct: practiceSize, total: practiceSize });
    } catch {
      setStep({ kind: "result", correct: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function showExample() {
    setLoading(true);
    try {
      const [q] = await questionsFor(skill!, 1);
      if (q) setUsed((u) => new Set([...u, q.id]));
      setStep({ kind: "example", question: q ?? null });
    } catch {
      setStep({ kind: "example", question: null });
    } finally {
      setLoading(false);
    }
  }

  function markDone(id: string, finished: boolean) {
    const latest: Report | null = reportsStore.get()?.find((r) => r.id === report!.id) ?? null;
    if (!latest) return;
    const completed = [...new Set([...latest.repair.completed, id])];
    saveReport({ ...latest, repair: { completed, finishedAt: finished ? Date.now() : latest.repair.finishedAt } });
  }

  function checkAgain() {
    const featured = report!.source.kind === "featured" ? FEATURED.find((t) => t.id === (report!.source as { topicId: string }).topicId) : null;
    sessionStore.set(
      featured
        ? featuredSession(featured)
        : newSession({ title: report!.title, subject: report!.subject, grade: report!.grade, source: report!.source, graph: report!.graph, plan: report!.plan }),
    );
    router.push("/check");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-semibold tracking-wide text-soil uppercase">Repair and climb</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">From {inSentence(report.graph.nodes[path[0]].short)} back up to {inSentence(target.short)}</h1>

      <ol aria-label="Your climb" className="mt-5 flex flex-wrap items-center gap-2">
        {path.map((id, i) => {
          const state = step.kind === "done" || i < stage ? "done" : i === stage ? "now" : "next";
          return (
            <li key={id} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-sun-ink">
                  →
                </span>
              )}
              <span
                aria-current={state === "now" ? "step" : undefined}
                className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${state === "done" ? "bg-ok-soft text-ok" : state === "now" ? "bg-sun-soft text-sun-ink ring-2 ring-sun" : "bg-surface-2 text-muted"}`}
              >
                {state === "done" && <span aria-hidden="true">✓ </span>}
                {report.graph.nodes[id].short}
                {state === "done" && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        {step.kind === "learn" && (
          <section className="rise rounded-2xl border border-line bg-surface p-6 sm:p-7" aria-busy={!lesson}>
            <p className="text-sm font-semibold text-muted">{isRoot ? "Step 1 · Understand it" : `Climbing up · ${skill.title}`}</p>
            {!lesson ? (
              <div role="status" className="mt-3 space-y-2">
                <p>Writing an explanation for you…</p>
                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-surface-2" />
              </div>
            ) : (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  <MathText text={lesson.title} />
                </h2>
                <div className="mt-3 space-y-3 text-[1.05rem] leading-relaxed">
                  {lesson.explanation.split(/\n{2,}/).map((p, i) => (
                    <MathText key={i} as="p" text={p} />
                  ))}
                </div>
                {lesson.steps.length > 0 && (
                  <ol className="mt-4 list-decimal space-y-1.5 rounded-xl bg-surface-2 p-4 pl-9">
                    {lesson.steps.map((s, i) => (
                      <MathText key={i} as="li" text={s} />
                    ))}
                  </ol>
                )}
                {lesson.tip && (
                  <p className="mt-4 rounded-xl border-l-4 border-sun bg-sun-soft p-3">
                    <span className="font-semibold">{lesson.source === "ai" ? "Remember: " : "In short: "}</span>
                    <MathText text={lesson.tip} />
                  </p>
                )}
                <p className="mt-3 text-xs text-muted">{lesson.source === "ai" ? "Explanation written by AI for your answers. If anything looks wrong, trust your textbook." : "From Taproot's checked lessons."}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" disabled={loading} onClick={isRoot ? showExample : startPractice} className="rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink disabled:opacity-60">
                    {loading ? "Getting it ready…" : isRoot ? "Show me an example" : `Practise ${inSentence(skill.short)}`}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {step.kind === "example" && (
          <section className="rise rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <p className="text-sm font-semibold text-muted">Step 2 · A worked example</p>
            {step.question ? (
              <>
                <MathText as="h2" text={step.question.prompt} display className="mt-2 text-lg font-semibold leading-relaxed" />
                <p className="mt-3">
                  <span className="font-semibold">Answer: </span>
                  <MathText text={step.question.options.find((o) => o.correct)!.text} />
                </p>
                <MathText as="p" text={step.question.explanation} className="mt-2 leading-relaxed text-muted" />
              </>
            ) : (
              <p className="mt-2">No example is available for this skill right now, so let&apos;s go straight to practice.</p>
            )}
            <button type="button" disabled={loading} onClick={startPractice} className="mt-5 rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink disabled:opacity-60">
              {loading ? "Getting questions…" : "I'm ready to practise"}
            </button>
          </section>
        )}

        {step.kind === "practice" && (
          <div>
            <p className="mb-3 text-sm text-muted">
              {isRoot ? "Step 3 · Practice" : "Practice"}: question {step.i + 1} of {step.questions.length}. You&apos;ll see the answer straight away.
            </p>
            <QuestionCard
              key={step.questions[step.i].id}
              question={step.questions[step.i]}
              feedback={step.revealed ? { chosen: step.chosen[step.i] } : null}
              onAnswer={(choice) => setStep({ ...step, chosen: [...step.chosen.slice(0, step.i), choice], revealed: true })}
            />
            {step.revealed && (
              <button
                type="button"
                autoFocus
                onClick={() => {
                  if (step.i + 1 < step.questions.length) setStep({ ...step, i: step.i + 1, revealed: false });
                  else {
                    const correct = step.questions.filter((q, k) => step.chosen[k] !== null && q.options[step.chosen[k]!].correct).length;
                    setStep({ kind: "result", correct, total: step.questions.length });
                  }
                }}
                className="mt-4 rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink"
              >
                {step.i + 1 < step.questions.length ? "Next question" : "See how I did"}
              </button>
            )}
          </div>
        )}

        {step.kind === "result" && (
          <section className="rise rounded-2xl border border-line bg-surface p-6 sm:p-7" role="status">
            {step.total === 0 ? (
              <p>We couldn&apos;t load practice questions just now. You can still move on.</p>
            ) : step.correct >= Math.ceil((step.total * 2) / 3) ? (
              <>
                <p className="font-display text-2xl font-semibold text-ok">
                  {step.correct} of {step.total}. {isRoot ? "Root repaired!" : "Solid!"}
                </p>
                <p className="mt-2 text-muted">
                  {stage + 1 < path.length ? `Next, climb up to ${inSentence(report.graph.nodes[path[stage + 1]].title)}.` : `That's the top: you're back at ${inSentence(target.title)}.`}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-semibold">
                  {step.correct} of {step.total}. Let&apos;s look at it another way.
                </p>
                <p className="mt-2 text-muted">That&apos;s normal: this is exactly the gap that was making things hard. A different explanation often helps.</p>
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {step.total > 0 && step.correct < Math.ceil((step.total * 2) / 3) ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonStyle("another-way");
                      setStep({ kind: "learn" });
                    }}
                    className="rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink"
                  >
                    Explain it another way
                  </button>
                  <button type="button" onClick={startPractice} className="rounded-xl border border-line px-5 py-3 font-semibold">
                    Practise again
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const last = stage + 1 >= path.length;
                    markDone(skill.id, last);
                    if (last) setStep({ kind: "done" });
                    else {
                      setStage(stage + 1);
                      setLessonStyle("first");
                      setStep({ kind: "learn" });
                    }
                  }}
                  className="rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink"
                >
                  {stage + 1 < path.length ? "Climb up" : "Finish"}
                </button>
              )}
            </div>
          </section>
        )}

        {step.kind === "done" && (
          <section className="rise rounded-3xl border-2 border-ok bg-surface p-6 text-center sm:p-10" role="status">
            <p className="text-5xl" aria-hidden="true">
              🌱
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">You climbed back up to {inSentence(target.title)}</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              The root is repaired and every skill above it held. Run a fresh check-up in about three days to make sure it has stuck, or now if you&apos;d like to see the difference.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={checkAgain} className="rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink">
                Check {inSentence(target.short)} again
              </button>
              <Link href={`/report?id=${report.id}`} className="rounded-xl border border-line px-5 py-3 font-semibold">
                Back to the report
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
