"use client";

import { SKILLS } from "@/shared/data/skills";
import type { FeaturedTopic, Question, Skill, Subject } from "@/shared/types";
import { Diagnoser, type DiagnosisResult, type DiagnosisState, type Why } from "../../shared/engine/diagnose";
import { buildSubgraph, type DiagnosticGraph } from "../../shared/engine/graph";
import { freshSeed } from "../../shared/questions/rng";
import { createLocalStore } from "./store";

export type Source =
  | { kind: "featured"; topicId: string }
  | { kind: "topic"; text: string; grade: number }
  | { kind: "problem"; text: string; grade: number };

export interface PlanStep {
  step: string;
  skillId: string;
}

export interface AskedQuestion {
  question: Question;
  /** Index of the option chosen, or null for "I'm not sure". */
  chosen: number | null;
  correct: boolean;
  why: Why;
}

export interface Session {
  id: string;
  createdAt: number;
  title: string;
  subject: Subject;
  grade: number;
  source: Source;
  graph: DiagnosticGraph;
  plan: PlanStep[] | null;
  seed: number;
  draws: number;
  engine: DiagnosisState;
  asked: AskedQuestion[];
  pending: { question: Question; why: Why } | null;
  /** Verified AI-written questions for skills Taproot doesn't have curated questions for. */
  aiPools: Record<string, Question[]>;
}

export interface Report {
  id: string;
  createdAt: number;
  title: string;
  subject: Subject;
  grade: number;
  source: Source;
  graph: DiagnosticGraph;
  plan: PlanStep[] | null;
  result: DiagnosisResult;
  asked: AskedQuestion[];
  repair: { completed: string[]; finishedAt: number | null };
}

export const sessionStore = createLocalStore<Session>("taproot:session");
export const reportsStore = createLocalStore<Report[]>("taproot:reports");

const MAX_REPORTS = 30;

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function newSession(args: {
  title: string;
  subject: Subject;
  grade: number;
  source: Source;
  graph: DiagnosticGraph;
  plan?: PlanStep[] | null;
}): Session {
  return {
    id: newId(),
    createdAt: Date.now(),
    title: args.title,
    subject: args.subject,
    grade: args.grade,
    source: args.source,
    graph: args.graph,
    plan: args.plan ?? null,
    seed: freshSeed(),
    draws: 0,
    engine: new Diagnoser(args.graph).init(),
    asked: [],
    pending: null,
    aiPools: {},
  };
}

export function featuredSession(topic: FeaturedTopic): Session {
  return newSession({
    title: topic.title,
    subject: topic.subject,
    grade: topic.grade,
    source: { kind: "featured", topicId: topic.id },
    graph: buildSubgraph(topic.targetId, (id) => SKILLS[id]),
  });
}

/** Builds a graph from AI-mapped nodes plus every curated skill they lead into. */
export function graphFromNodes(targetId: string, generated: Skill[]): DiagnosticGraph {
  const extra = Object.fromEntries(generated.map((s) => [s.id, s]));
  return buildSubgraph(targetId, (id) => extra[id] ?? SKILLS[id]);
}

export function listReports(): Report[] {
  return [...(reportsStore.get() ?? [])].sort((a, b) => b.createdAt - a.createdAt);
}

export const getReport = (id: string) => (reportsStore.get() ?? []).find((r) => r.id === id) ?? null;

export function saveReport(report: Report) {
  const rest = (reportsStore.get() ?? []).filter((r) => r.id !== report.id);
  reportsStore.set([report, ...rest].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_REPORTS));
}

export function deleteReport(id: string) {
  reportsStore.set((reportsStore.get() ?? []).filter((r) => r.id !== id));
}

/** Removes a skill that couldn't get questions: its dependents inherit its prerequisites. */
export function dropSkill(session: Session, id: string): Session {
  const nodes: Record<string, Skill> = {};
  const removed = session.graph.nodes[id];
  for (const [k, s] of Object.entries(session.graph.nodes)) {
    if (k === id) continue;
    nodes[k] = s.prereqs.includes(id) ? { ...s, prereqs: [...new Set([...s.prereqs.filter((p) => p !== id), ...removed.prereqs])] } : s;
  }
  const status = { ...session.engine.status };
  delete status[id];
  return {
    ...session,
    graph: { ...session.graph, nodes },
    engine: { ...session.engine, status, current: session.engine.current === id ? null : session.engine.current, why: null },
    pending: null,
  };
}
