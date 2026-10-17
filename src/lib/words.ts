import type { NodeStatus, Why } from "@/lib/engine/diagnose";
import type { Skill } from "@/lib/types";

const title = (nodes: Record<string, Skill>, id: string) => nodes[id]?.title ?? id;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One plain sentence saying why this question is being asked. */
export function whyText(why: Why, skillId: string, nodes: Record<string, Skill>): string {
  const skill = title(nodes, skillId);
  switch (why.kind) {
    case "target":
      return `First, a quick look at ${skill} itself.`;
    case "repeat":
      return why.tiebreak
        ? `Your answers on ${skill} were mixed, so here's one more to be sure.`
        : `Another question on ${skill}, so one slip can't decide anything.`;
    case "foundation": {
      const of = title(nodes, why.of);
      const covers = why.covers > 0 ? ` It sits underneath ${plural(why.covers, "other skill")} too, so this one check narrows things down a lot.` : "";
      return why.direct
        ? `${of} is built on ${skill}. Let's see whether the trouble starts here.${covers}`
        : `${skill} is one of the deeper foundations under ${of}.${covers}`;
    }
    case "branch":
      return `We've found where one gap starts. ${skill} is another foundation of ${title(nodes, why.of)}, so a quick check makes sure nothing else is hiding there.`;
  }
}

export type DisplayStatus = NodeStatus | "root";

export const STATUS: Record<DisplayStatus, { label: string; icon: string; description: string }> = {
  root: { label: "Root gap", icon: "◆", description: "Where the trouble starts" },
  gap: { label: "Shaky", icon: "✕", description: "Answers showed a gap, caused by a deeper one" },
  "inferred-gap": { label: "Affected", icon: "!", description: "Builds on a gap, so it is affected too" },
  mastered: { label: "Solid", icon: "✓", description: "Answered confidently" },
  "inferred-mastered": { label: "Assumed solid", icon: "○", description: "Not asked: a skill built on it was solid" },
  untested: { label: "Not checked", icon: "·", description: "Not needed for this check" },
};

export function displayStatus(id: string, status: Record<string, NodeStatus>, rootIds: ReadonlySet<string>): DisplayStatus {
  return rootIds.has(id) ? "root" : (status[id] ?? "untested");
}

export const CONFIDENCE: Record<"high" | "medium" | "low", string> = {
  high: "Clear signal: every answer on this skill pointed the same way.",
  medium: "Likely: the answers were mostly, but not all, consistent.",
  low: "Possible: the check ended before every foundation underneath could be checked.",
};

export function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return new Date(ms).toDateString();
  }
}
