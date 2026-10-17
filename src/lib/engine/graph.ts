import type { Skill } from "@/lib/types";

/** A target skill plus everything it builds on. Edges point from a skill to its prerequisites. */
export interface DiagnosticGraph {
  targetId: string;
  nodes: Record<string, Skill>;
}

export function buildSubgraph(targetId: string, lookup: (id: string) => Skill | undefined): DiagnosticGraph {
  const nodes: Record<string, Skill> = {};
  const queue = [targetId];
  while (queue.length) {
    const id = queue.shift()!;
    if (nodes[id]) continue;
    const skill = lookup(id);
    if (!skill) throw new Error(`Unknown skill ${id}`);
    nodes[id] = skill;
    queue.push(...skill.prereqs);
  }
  return { targetId, nodes };
}

/** Precomputed relations used by the engine. */
export interface GraphIndex {
  ids: string[];
  /** Direct prerequisites inside the graph. */
  prereqs: Record<string, string[]>;
  /** Direct dependents (skills that list this one as a prerequisite). */
  dependents: Record<string, string[]>;
  /** All prerequisites, direct and indirect (not including the node itself). */
  below: Record<string, Set<string>>;
  /** All dependents, direct and indirect (not including the node itself). */
  above: Record<string, Set<string>>;
  /** Shortest number of prerequisite steps from the target. */
  depth: Record<string, number>;
}

export function indexGraph(graph: DiagnosticGraph): GraphIndex {
  const ids = Object.keys(graph.nodes);
  const prereqs: Record<string, string[]> = {};
  const dependents: Record<string, string[]> = {};
  for (const id of ids) {
    prereqs[id] = graph.nodes[id].prereqs.filter((p) => p in graph.nodes);
    dependents[id] = [];
  }
  for (const id of ids) for (const p of prereqs[id]) dependents[p].push(id);

  const walk = (start: string, next: Record<string, string[]>) => {
    const seen = new Set<string>();
    const stack = [...next[start]];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...next[id]);
    }
    return seen;
  };
  const below: Record<string, Set<string>> = {};
  const above: Record<string, Set<string>> = {};
  for (const id of ids) {
    below[id] = walk(id, prereqs);
    above[id] = walk(id, dependents);
  }

  const depth: Record<string, number> = { [graph.targetId]: 0 };
  const queue = [graph.targetId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const p of prereqs[id]) {
      if (depth[p] === undefined) {
        depth[p] = depth[id] + 1;
        queue.push(p);
      }
    }
  }
  return { ids, prereqs, dependents, below, above, depth };
}

/** Returns one cycle (as a list of ids) if the prerequisite relation has one, else null. */
export function findCycle(nodes: Record<string, Pick<Skill, "prereqs">>): string[] | null {
  const state: Record<string, 0 | 1 | 2> = {};
  const path: string[] = [];
  const visit = (id: string): string[] | null => {
    state[id] = 1;
    path.push(id);
    for (const p of nodes[id]?.prereqs ?? []) {
      if (!(p in nodes)) continue;
      if (state[p] === 1) return [...path.slice(path.indexOf(p)), p];
      if (!state[p]) {
        const found = visit(p);
        if (found) return found;
      }
    }
    path.pop();
    state[id] = 2;
    return null;
  };
  for (const id of Object.keys(nodes)) {
    if (!state[id]) {
      const found = visit(id);
      if (found) return found;
    }
  }
  return null;
}

/** Shortest chain of skills from `from` up to `to` along dependents, e.g. root gap → … → target. */
export function pathUp(index: GraphIndex, from: string, to: string): string[] {
  const prev: Record<string, string | null> = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === to) break;
    for (const d of index.dependents[id]) {
      if (!(d in prev)) {
        prev[d] = id;
        queue.push(d);
      }
    }
  }
  if (!(to in prev)) return [from];
  const path: string[] = [];
  for (let at: string | null = to; at !== null; at = prev[at]) path.unshift(at);
  return path;
}
