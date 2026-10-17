"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SKILLS } from "@/data/skills";
import { FEATURED } from "@/data/topics";
import { buildSubgraph } from "@/lib/engine/graph";
import { featuredSession, graphFromNodes, newSession, sessionStore, type PlanStep } from "@/lib/session";
import { useStore } from "@/lib/store";
import type { Skill, Subject } from "@/lib/types";

const SUBJECT: Record<Subject, { label: string; className: string }> = {
  maths: { label: "Maths", className: "bg-leaf-soft text-leaf" },
  physics: { label: "Physics", className: "bg-soil-soft text-soil" },
  chemistry: { label: "Chemistry", className: "bg-sun-soft text-sun-ink" },
  other: { label: "Other", className: "bg-surface-2 text-muted" },
};

const SIZES = Object.fromEntries(FEATURED.map((t) => [t.id, Object.keys(buildSubgraph(t.targetId, (id) => SKILLS[id]).nodes).length]));

interface MapResponse {
  title: string;
  subject: Subject;
  targetId: string;
  nodes: Skill[];
  plan: PlanStep[];
  refusal?: string;
  error?: string;
}

export function StartForm() {
  const router = useRouter();
  const session = useStore(sessionStore);
  const [mode, setMode] = useState<"topic" | "problem">("topic");
  const [text, setText] = useState("");
  const [grade, setGrade] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<boolean | null>(null);
  const textId = useId();
  const gradeId = useId();
  const noteId = useId();

  useEffect(() => {
    let live = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { ai: boolean }) => live && setAi(Boolean(d.ai)))
      .catch(() => live && setAi(false));
    return () => {
      live = false;
    };
  }, []);

  const startFeatured = (topicId: string) => {
    const topic = FEATURED.find((t) => t.id === topicId)!;
    sessionStore.set(featuredSession(topic));
    router.push("/check");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (value.length < 3) {
      setError(mode === "topic" ? "Type the name of a topic or chapter." : "Paste the problem you're stuck on.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, text: value, grade }),
      });
      const data = (await res.json().catch(() => null)) as MapResponse | null;
      if (!res.ok || !data) throw new Error(data?.error ?? "Something went wrong. Please try again.");
      if (data.refusal) throw new Error(data.refusal);
      const graph = graphFromNodes(data.targetId, data.nodes);
      sessionStore.set(
        newSession({ title: data.title, subject: data.subject, grade, source: { kind: mode, text: value, grade }, graph, plan: data.plan }),
      );
      router.push("/check");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      {session && (
        <div className="rise flex flex-col gap-3 rounded-2xl border border-sun bg-sun-soft p-5 sm:flex-row sm:items-center">
          <p className="flex-1">
            You have a check-up in progress on <strong>{session.title}</strong> ({session.asked.length} answered).
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.push("/check")} className="rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
              Continue
            </button>
            <button type="button" onClick={() => sessionStore.set(null)} className="rounded-xl border border-line bg-surface px-4 py-2 font-semibold">
              Discard
            </button>
          </div>
        </div>
      )}

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="font-display text-2xl font-semibold">
          Pick the chapter you&apos;re stuck on
        </h2>
        <p className="mt-1 text-muted">These chapters have hand-checked skill trees and questions, and work even without the AI service.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => startFeatured(t.id)}
                className="group flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-leaf hover:shadow-md"
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`rounded-full px-2 py-0.5 ${SUBJECT[t.subject].className}`}>{SUBJECT[t.subject].label}</span>
                  <span className="text-muted">Class {t.grade}</span>
                </span>
                <span className="mt-3 font-display text-xl font-semibold group-hover:text-leaf">{t.title}</span>
                <span className="mt-1 text-sm text-muted">{t.blurb}</span>
                <span className="mt-auto pt-4 text-sm text-soil">
                  {SIZES[t.id]} skills in its roots · <span className="font-semibold text-leaf">Start →</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="custom-heading" className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <h2 id="custom-heading" className="font-display text-2xl font-semibold">
          Something else?
        </h2>
        <p className="mt-1 text-muted">
          Type any maths or science topic, or paste the exact problem you can&apos;t solve. AI maps the skills it needs, links them to Taproot&apos;s checked foundations, and writes any extra questions, each one double-checked by a second AI model.
        </p>

        {ai === false && (
          <p role="status" className="mt-4 rounded-xl bg-surface-2 p-4 text-sm">
            Custom topics need the AI service, which isn&apos;t switched on for this copy of Taproot. The featured chapters above work fully.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4" aria-describedby={noteId}>
          <fieldset>
            <legend className="sr-only">What do you want to check?</legend>
            <div className="inline-flex rounded-xl border border-line bg-paper p-1">
              {(["topic", "problem"] as const).map((m) => (
                <label key={m} className="cursor-pointer">
                  <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="peer sr-only" />
                  <span className="block rounded-lg px-4 py-2 text-sm font-semibold text-muted peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]">
                    {m === "topic" ? "A topic" : "A problem I'm stuck on"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={textId} className="block font-semibold">
              {mode === "topic" ? "Topic or chapter" : "The problem"}
            </label>
            {mode === "topic" ? (
              <input
                id={textId}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={120}
                placeholder="e.g. Arithmetic progressions, Work and energy, Probability"
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-base"
              />
            ) : (
              <>
                <textarea
                  id={textId}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1200}
                  rows={4}
                  placeholder="Paste or type the question exactly as it appears in your book."
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-base"
                />
                <p className="mt-1.5 text-sm text-muted">
                  Try one:{" "}
                  {FEATURED.slice(0, 3).map((t, i) => (
                    <span key={t.id}>
                      {i > 0 && " · "}
                      <button type="button" className="underline underline-offset-2" onClick={() => setText(t.sampleProblem)}>
                        {t.title.toLowerCase()}
                      </button>
                    </span>
                  ))}
                </p>
              </>
            )}
          </div>

          <div>
            <label htmlFor={gradeId} className="block font-semibold">
              Your class
            </label>
            <select
              id={gradeId}
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="mt-1.5 rounded-xl border border-line bg-paper px-4 py-3 text-base"
            >
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Class {g}
                  {g >= 11 ? ` (PU ${g - 10})` : ""}
                </option>
              ))}
            </select>
          </div>

          <p id={noteId} className="text-sm text-muted">
            Please don&apos;t include your name or other personal details. This text is sent to an AI service (Groq) to build your skill tree. Taproot doesn&apos;t store it.
          </p>

          {error && (
            <p role="alert" className="rounded-xl bg-gap-soft p-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || ai === false}
            className="rounded-xl bg-leaf px-6 py-3 font-semibold text-leaf-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Mapping the skills this needs…" : "Build my skill tree"}
          </button>
        </form>
      </section>
    </div>
  );
}
