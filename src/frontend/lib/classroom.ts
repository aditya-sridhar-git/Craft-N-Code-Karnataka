"use client";

import type { ClassResult, ClassView, TeacherClass, TeacherProfile } from "@/shared/classes";
import type { Report } from "./session";
import { createLocalStore } from "./store";

/** The class this student has joined on this device, if any. Students never have accounts. */
export interface JoinedClass {
  code: string;
  name: string;
  /** What the student asked to be called. Kept on this device only; never sent anywhere. */
  nickname?: string;
}

export const joinedStore = createLocalStore<JoinedClass>("taproot:class");
/** Which reports were shared with a class (report id → class name), so the report can say so. */
export const sentStore = createLocalStore<Record<string, string>>("taproot:class-sent");

export type Reply<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

async function call<T>(url: string, body?: unknown): Promise<Reply<T>> {
  try {
    const res = await fetch(
      url,
      body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error ?? "Something went wrong. Please try again.", status: res.status };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Couldn't reach Taproot. Check your connection and try again.", status: 0 };
  }
}

/* Teacher accounts */
export const signUp = (name: string, email: string, password: string) => call<TeacherProfile>("/api/teacher/signup", { name, email, password });
export const signIn = (email: string, password: string) => call<TeacherProfile>("/api/teacher/signin", { email, password });
export const signOut = () => call<{ ok: true }>("/api/teacher/signout", {});
export const whoAmI = () => call<{ teacher: TeacherProfile; classes: TeacherClass[] }>("/api/teacher/me");

/* Classes (teacher side needs a signed-in session) */
export const createClass = (name: string) => call<{ code: string; name: string }>("/api/class", { name });
export const loadClass = (code: string) => call<ClassView>("/api/class/view", { code });
export const removeClass = (code: string) => call<{ ok: true }>("/api/class/delete", { code });

/* Student side */
export const findClass = (code: string) => call<{ code: string; name: string }>("/api/class/join", { code });

/** The only thing a class ever receives: the outcome of a check-up, with no name or answers. */
export function toClassResult(report: Report): ClassResult {
  const root = report.result.roots[0];
  const skill = root ? report.graph.nodes[root.skillId] : undefined;
  const mis = root?.misconceptions[0] ? skill?.misconceptions.find((m) => m.id === root.misconceptions[0].id) : undefined;
  return {
    topicTitle: report.title.slice(0, 120),
    subject: report.subject,
    grade: Math.min(12, Math.max(6, Math.round(report.grade))),
    rootSkillId: root?.skillId.slice(0, 80) ?? null,
    rootTitle: skill?.title.slice(0, 120) ?? null,
    misconception: mis?.label.slice(0, 200) ?? null,
    confidence: root?.confidence ?? null,
    noGap: !root,
    questions: Math.min(100, report.result.questionsAsked),
  };
}

/** Sends a finished check-up to the joined class, if any. Failure never blocks the student. */
export async function sendToClass(report: Report): Promise<boolean> {
  const joined = joinedStore.get();
  if (!joined) return false;
  const reply = await call<{ ok: true }>("/api/class/result", { code: joined.code, result: toClassResult(report) });
  if (reply.ok) sentStore.set({ ...(sentStore.get() ?? {}), [report.id]: joined.name });
  return reply.ok;
}
