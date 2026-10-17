"use client";

import { Diagnoser } from "./engine/diagnose";
import { drawQuestion, hasCuratedQuestions } from "./questions";
import { createRng } from "./questions/rng";
import type { Report, Session } from "./session";
import type { Question, Skill } from "./types";

export type Advance =
  | { kind: "question"; session: Session }
  | { kind: "done"; report: Report }
  /** The next skill was written by AI and needs (more) verified questions. */
  | { kind: "needs-questions"; session: Session; skillId: string };

const diagnosers = new WeakMap<object, Diagnoser>();
function diagnoser(session: Session) {
  let d = diagnosers.get(session.graph);
  if (!d) {
    d = new Diagnoser(session.graph);
    diagnosers.set(session.graph, d);
  }
  return d;
}

export function toReport(session: Session): Report {
  return {
    id: session.id,
    createdAt: Date.now(),
    title: session.title,
    subject: session.subject,
    grade: session.grade,
    source: session.source,
    graph: session.graph,
    plan: session.plan,
    result: diagnoser(session).summarize(session.engine),
    asked: session.asked,
    repair: { completed: [], finishedAt: null },
  };
}

/** Picks the next question (or finishes) for a session with nothing pending. */
export function advance(session: Session): Advance {
  const d = diagnoser(session);
  const { state, step } = d.next(session.engine);
  if (step.kind === "done") return { kind: "done", report: toReport({ ...session, engine: state }) };

  const skill = session.graph.nodes[step.skillId];
  const used = new Set(session.asked.map((a) => a.question.id));
  if (!skill.generated && hasCuratedQuestions(skill.id)) {
    const question = drawQuestion(skill.id, createRng(session.seed + 7919 * (session.draws + 1)), used);
    if (question) {
      return { kind: "question", session: { ...session, engine: state, draws: session.draws + 1, pending: { question, why: step.why } } };
    }
  }
  const pool = (session.aiPools[skill.id] ?? []).filter((q) => !used.has(q.id));
  if (pool.length) return { kind: "question", session: { ...session, engine: state, pending: { question: pool[0], why: step.why } } };
  return { kind: "needs-questions", session: { ...session, engine: state }, skillId: skill.id };
}

/** Records the answer to the pending question. `choice` null means "I'm not sure". */
export function answer(session: Session, choice: number | null): Session {
  const pending = session.pending;
  if (!pending) return session;
  const q = pending.question;
  const option = choice === null ? null : q.options[choice];
  const correct = Boolean(option?.correct);
  const engine = diagnoser(session).record(session.engine, {
    questionId: q.id,
    correct,
    unsure: choice === null,
    misconceptionId: option && !option.correct ? option.misconceptionId : null,
  });
  return { ...session, engine, asked: [...session.asked, { question: q, chosen: choice, correct, why: pending.why }], pending: null };
}

/** Decides the current skill from the answers so far (no more questions available). */
export function settleCurrent(session: Session): Session | null {
  const engine = diagnoser(session).settle(session.engine);
  return engine ? { ...session, engine, pending: null } : null;
}

export function endEarly(session: Session): Report {
  return toReport({ ...session, engine: { ...session.engine, current: null, done: "budget" } });
}

export async function fetchQuestions(skill: Skill, context: string): Promise<Question[]> {
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      skill: { id: skill.id, title: skill.title, summary: skill.summary, grade: skill.grade, subject: skill.subject, misconceptions: skill.misconceptions },
      context,
    }),
  });
  const data = (await res.json().catch(() => null)) as { questions?: Question[]; error?: string } | null;
  if (!res.ok || !data?.questions) throw new Error(data?.error ?? `The question service returned ${res.status}.`);
  return data.questions;
}
