import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { SKILLS } from "@/shared/data/skills";
import type { DiagnosisResult, NodeStatus, RootGap } from "../../shared/engine/diagnose";
import type { DiagnosticGraph } from "../../shared/engine/graph";
import type { Skill, Subject } from "../../shared/types";

/**
 * A report packed into the URL fragment (#…), so a teacher can open it without any database.
 * The fragment is never sent to a server. Individual answers are left out on purpose.
 */
export interface SharedReport {
  title: string;
  subject: Subject;
  grade: number;
  createdAt: number;
  graph: DiagnosticGraph;
  result: DiagnosisResult;
}

const CODE: Record<NodeStatus, string> = { untested: "u", mastered: "m", gap: "g", "inferred-mastered": "M", "inferred-gap": "G" };
const DECODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k])) as Record<string, NodeStatus>;

interface Packed {
  v: 1;
  t: string;
  s: Subject;
  g: number;
  d: number;
  target: string;
  /** Curated skill ids, and full AI-made skills (which only exist in this report). */
  c: string[];
  a: Skill[];
  st: string;
  r: RootGap[];
  q: number;
  b: boolean;
}

export function encodeReport(r: SharedReport): string {
  const ids = Object.keys(r.graph.nodes);
  const packed: Packed = {
    v: 1,
    t: r.title,
    s: r.subject,
    g: r.grade,
    d: r.createdAt,
    target: r.graph.targetId,
    c: ids.filter((id) => !r.graph.nodes[id].generated),
    a: ids.filter((id) => r.graph.nodes[id].generated).map((id) => r.graph.nodes[id]),
    st: ids.map((id) => `${id}:${CODE[r.result.status[id] ?? "untested"]}`).join(","),
    r: r.result.roots,
    q: r.result.questionsAsked,
    b: r.result.budgetHit,
  };
  return compressToEncodedURIComponent(JSON.stringify(packed));
}

export function decodeReport(fragment: string): SharedReport | null {
  try {
    const json = decompressFromEncodedURIComponent(fragment.replace(/^#/, ""));
    if (!json) return null;
    const p = JSON.parse(json) as Packed;
    if (p.v !== 1) return null;
    const nodes: Record<string, Skill> = {};
    for (const id of p.c) if (SKILLS[id]) nodes[id] = SKILLS[id];
    for (const s of p.a) nodes[s.id] = { ...s, generated: true };
    if (!nodes[p.target]) return null;
    // Keep only edges between skills present in the report.
    for (const id of Object.keys(nodes)) nodes[id] = { ...nodes[id], prereqs: nodes[id].prereqs.filter((x) => nodes[x]) };
    const status: Record<string, NodeStatus> = {};
    for (const pair of p.st.split(",")) {
      const [id, c] = pair.split(":");
      if (nodes[id] && DECODE[c]) status[id] = DECODE[c];
    }
    return {
      title: p.t,
      subject: p.s,
      grade: p.g,
      createdAt: p.d,
      graph: { targetId: p.target, nodes },
      result: {
        targetId: p.target,
        roots: p.r.filter((x) => nodes[x.skillId]),
        status,
        questionsAsked: p.q,
        budgetHit: p.b,
        targetMastered: status[p.target] === "mastered" || status[p.target] === "inferred-mastered",
      },
    };
  } catch {
    return null;
  }
}
