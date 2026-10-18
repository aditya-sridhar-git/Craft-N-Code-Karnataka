"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuestionCard } from "@/frontend/components/QuestionCard";
import { indexGraph, pathUp, type DiagnosticGraph, type GraphIndex } from "@/shared/engine/graph";
import { sendToClass } from "@/frontend/lib/classroom";
import { advance, answer, endEarly, fetchQuestions, settleCurrent } from "@/frontend/lib/flow";
import { dropSkill, saveReport, sessionStore, type Report } from "@/frontend/lib/session";
import { useStore } from "@/frontend/lib/store";
import { whyText } from "@/shared/words";

const indexes = new WeakMap<DiagnosticGraph, GraphIndex>();
function indexOf(graph: DiagnosticGraph) {
  let i = indexes.get(graph);
  if (!i) {
    i = indexGraph(graph);
    indexes.set(graph, i);
  }
  return i;
}

export function CheckRunner() {
  const session = useStore(sessionStore);
  const router = useRouter();
  const [problem, setProblem] = useState<{ skillId: string; message: string } | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [bump, setBump] = useState(0);
  const inflight = useRef<string | null>(null);
  const prefetching = useRef<string | null>(null);
  const tried = useRef(new Set<string>());
  const lastAiCall = useRef(0);
  const prefetchStopped = useRef(false);

  // What should happen next is a pure function of the stored session.
  const next = useMemo(() => (session && !session.pending ? advance(session) : null), [session]);
  const loadingSkill = next?.kind === "needs-questions" && !problem ? next.skillId : null;

  const finish = useCallback(
    (report: Report) => {
      saveReport(report);
      void sendToClass(report);
      sessionStore.set(null);
      router.replace(`/report?id=${report.id}`);
    },
    [router],
  );

  useEffect(() => {
    if (!next) return;
    if (next.kind === "question") return sessionStore.set(next.session);
    if (next.kind === "done") return finish(next.report);
    // Wait for a background prefetch of this skill rather than asking twice.
    if (problem || inflight.current === next.skillId || prefetching.current === next.skillId) return;
    const skill = next.session.graph.nodes[next.skillId];
    inflight.current = skill.id;
    fetchQuestions(skill, next.session.title)
      .then((questions) => {
        const latest = sessionStore.get();
        if (!latest) return;
        const have = new Set([...(latest.aiPools[skill.id] ?? []), ...latest.asked.map((a) => a.question)].map((q) => q.id));
        const fresh = questions.filter((q) => !have.has(q.id));
        if (!fresh.length) throw new Error("There are no more double-checked questions for this skill.");
        sessionStore.set({ ...latest, aiPools: { ...latest.aiPools, [skill.id]: [...(latest.aiPools[skill.id] ?? []), ...fresh] } });
      })
      .catch((e: Error) => setProblem({ skillId: skill.id, message: e.message }))
      .finally(() => {
        inflight.current = null;
        lastAiCall.current = Date.now();
        setBump((b) => b + 1);
      });
  }, [next, problem, finish, bump]);

  // While the student answers, quietly fetch questions for the other AI-made skills, one at a time
  // and spaced out to stay within the free AI quota, so they're ready if the check-up gets there.
  // Each skill is prefetched at most once; after any failure the on-demand path takes over.
  useEffect(() => {
    if (!session || prefetchStopped.current || inflight.current || prefetching.current || next?.kind === "needs-questions") return;
    const depth = indexOf(session.graph).depth;
    const skill = Object.values(session.graph.nodes)
      .filter((n) => n.generated && !session.aiPools[n.id]?.length && !tried.current.has(n.id) && session.engine.status[n.id] === "untested")
      .sort((a, b) => (depth[a.id] ?? 99) - (depth[b.id] ?? 99))[0];
    if (!skill) return;
    const wait = lastAiCall.current + 8000 - Date.now();
    if (wait > 0) {
      const timer = setTimeout(() => setBump((b) => b + 1), wait);
      return () => clearTimeout(timer);
    }
    tried.current.add(skill.id);
    prefetching.current = skill.id;
    fetchQuestions(skill, session.title)
      .then((questions) => {
        const latest = sessionStore.get();
        if (latest && !latest.aiPools[skill.id]?.length) sessionStore.set({ ...latest, aiPools: { ...latest.aiPools, [skill.id]: questions } });
      })
      .catch(() => {
        prefetchStopped.current = true;
      })
      .finally(() => {
        prefetching.current = null;
        lastAiCall.current = Date.now();
        setBump((b) => b + 1);
      });
  }, [session, next, bump]);

  // Each new question starts at the top, so the progress bar and the trail stay in view.
  const pendingId = session?.pending?.question.id;
  useEffect(() => {
    if (pendingId && window.scrollY > 0) window.scrollTo({ top: 0 });
  }, [pendingId]);

  const onAnswer = useCallback((choice: number | null) => {
    const s = sessionStore.get();
    if (s?.pending) sessionStore.set(answer(s, choice));
  }, []);

  if (session === undefined) return <p className="text-muted">Loading…</p>;
  if (session === null) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold">No check-up in progress</h1>
        <p className="mt-2 text-muted">Pick the chapter you&apos;re stuck on and Taproot will trace it to the root.</p>
        <Link href="/start" className="mt-4 inline-block rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink">
          Start a check-up
        </Link>
      </div>
    );
  }

  const nodes = session.graph.nodes;
  const index = indexOf(session.graph);
  const currentId = session.pending ? session.pending.question.skillId : loadingSkill ?? problem?.skillId ?? null;
  const trail = currentId && nodes[currentId] ? pathUp(index, currentId, session.graph.targetId).reverse() : [session.graph.targetId];
  const answered = session.asked.length;
  const budget = session.engine.budget;
  const hasEvidence = problem ? session.asked.some((a) => a.question.skillId === problem.skillId) : false;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-wide text-soil uppercase">Check-up</p>
        <button
          type="button"
          onClick={() => (confirmEnd ? finish(endEarly(session)) : setConfirmEnd(true))}
          onBlur={() => setConfirmEnd(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
        >
          {confirmEnd ? "Sure? End and see results" : "End check now"}
        </button>
      </div>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{session.title}</h1>

      <div className="mt-4">
        <div className="flex justify-between text-sm text-muted">
          <span>{answered === 0 ? "Let's begin" : `${answered} answered`}</span>
          <span>Usually 10–16 questions</span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={budget}
          aria-valuenow={answered}
        >
          <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${Math.min(100, (answered / budget) * 100)}%` }} />
        </div>
      </div>

      <nav aria-label="Where we are in your skill tree" className="mt-5">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          {trail.map((id, i) => (
            <li key={id} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-soil">
                  ↓
                </span>
              )}
              <span className={i === trail.length - 1 ? "rounded-md bg-sun-soft px-2 py-0.5 font-semibold text-sun-ink" : "text-muted"}>
                {nodes[id]?.short ?? id}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-4" aria-live="polite">
        {session.pending && <p className="mb-3 text-[0.95rem] leading-relaxed text-muted">{whyText(session.pending.why, session.pending.question.skillId, nodes)}</p>}
      </div>

      {session.pending && <QuestionCard key={session.pending.question.id} question={session.pending.question} label={`Question ${answered + 1}`} onAnswer={onAnswer} />}

      {loadingSkill && !session.pending && (
        <div role="status" className="rise rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">Writing questions on {nodes[loadingSkill]?.title}…</p>
          <p className="mt-1 text-sm text-muted">
            Taproot doesn&apos;t have ready-made questions for this skill, so AI is writing some. A second, independent model then solves each one, and only questions where both agree are kept. This takes a few seconds.
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-sun" />
          </div>
        </div>
      )}

      {problem && !session.pending && (
        <div role="alert" className="rise rounded-2xl border border-gap bg-gap-soft p-6">
          <p className="font-semibold">We couldn&apos;t get questions for {nodes[problem.skillId]?.title}.</p>
          <p className="mt-1 text-sm">{problem.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setProblem(null)} className="rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
              Try again
            </button>
            {hasEvidence && (
              <button
                type="button"
                onClick={() => {
                  const s = settleCurrent(session);
                  if (s) sessionStore.set(s);
                  setProblem(null);
                }}
                className="rounded-xl border border-line bg-surface px-4 py-2 font-semibold"
              >
                Use the answers so far
              </button>
            )}
            {problem.skillId !== session.graph.targetId && !hasEvidence && (
              <button
                type="button"
                onClick={() => {
                  sessionStore.set(dropSkill(session, problem.skillId));
                  setProblem(null);
                }}
                className="rounded-xl border border-line bg-surface px-4 py-2 font-semibold"
              >
                Skip this skill
              </button>
            )}
            <Link href="/start" className="rounded-xl border border-line bg-surface px-4 py-2 font-semibold">
              Choose a featured topic
            </Link>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm leading-relaxed text-muted">
        This is a check-up, not a test. You&apos;ll see every answer at the end. If you don&apos;t know, choose <strong>I&apos;m not sure</strong>: a guess makes the check less accurate.
      </p>
    </div>
  );
}
