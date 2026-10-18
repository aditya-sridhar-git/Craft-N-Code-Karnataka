"use client";

import { Graph, layout } from "@dagrejs/dagre";
import { useId, useMemo } from "react";
import type { NodeStatus } from "@/shared/engine/diagnose";
import type { DiagnosticGraph } from "@/shared/engine/graph";
import { displayStatus, STATUS, type DisplayStatus } from "@/shared/words";

const NODE_H = 40;
const RANK_SEP = 46;

const STYLE: Record<DisplayStatus, { fill: string; stroke: string; text: string; dash?: string; width: number }> = {
  root: { fill: "var(--gap-soft)", stroke: "var(--gap)", text: "var(--ink)", width: 3 },
  gap: { fill: "var(--gap-soft)", stroke: "var(--gap)", text: "var(--ink)", width: 1.5 },
  "inferred-gap": { fill: "var(--affected-soft)", stroke: "var(--affected)", text: "var(--ink)", dash: "5 4", width: 1.5 },
  mastered: { fill: "var(--ok-soft)", stroke: "var(--ok)", text: "var(--ink)", width: 1.5 },
  "inferred-mastered": { fill: "var(--surface)", stroke: "var(--ok)", text: "var(--ink)", dash: "5 4", width: 1.2 },
  untested: { fill: "var(--surface-2)", stroke: "var(--line)", text: "var(--muted)", dash: "3 4", width: 1.2 },
};

const labelWidth = (label: string) => Math.max(92, Math.round(label.length * 7.2 + 40));

export function RootTree({
  graph,
  status,
  roots,
  path = [],
}: {
  graph: DiagnosticGraph;
  status: Record<string, NodeStatus>;
  roots: ReadonlySet<string>;
  /** Highlighted chain from the main root gap up to the topic. */
  path?: string[];
}) {
  const titleId = useId();
  const descId = useId();

  const drawn = useMemo(() => {
    const g = new Graph();
    g.setGraph({ rankdir: "TB", nodesep: 16, ranksep: RANK_SEP, marginx: 14, marginy: 34 });
    g.setDefaultEdgeLabel(() => ({}));
    const ids = Object.keys(graph.nodes);
    for (const id of ids) g.setNode(id, { width: labelWidth(graph.nodes[id].short), height: NODE_H });
    for (const id of ids) for (const p of graph.nodes[id].prereqs) if (graph.nodes[p]) g.setEdge(id, p);
    layout(g);
    const nodes = ids.map((id) => {
      const n = g.node(id);
      return { id, x: n.x, y: n.y, w: n.width, label: graph.nodes[id].short };
    });
    const edges = g.edges().map((e) => ({ from: e.v, to: e.w }));
    const info = g.graph();
    return { nodes, edges, width: Math.ceil(info.width ?? 400), height: Math.ceil(info.height ?? 300) };
  }, [graph]);

  const byId = Object.fromEntries(drawn.nodes.map((n) => [n.id, n]));
  const target = byId[graph.targetId];
  const soilY = target.y + NODE_H / 2 + RANK_SEP / 2;
  const onPath = new Set<string>();
  for (let i = 0; i + 1 < path.length; i++) onPath.add(`${path[i + 1]}>${path[i]}`);

  const rootTitles = [...roots].map((r) => graph.nodes[r]?.title).filter(Boolean);

  // The soil is painted on the container so it spans the full width, however wide the tree is.
  const soil = `linear-gradient(to bottom, var(--surface) ${soilY - 1}px, var(--soil) ${soilY - 1}px, var(--soil) ${soilY + 1}px, var(--soil-soft) ${soilY + 1}px, color-mix(in srgb, var(--soil-soft) 30%, var(--surface)) 100%)`;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Skill tree (scrolls sideways on small screens)"
      className="overflow-x-auto rounded-2xl border border-line bg-surface"
      style={{ backgroundImage: soil }}
    >
      <svg
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        width={drawn.width}
        height={drawn.height}
        viewBox={`0 0 ${drawn.width} ${drawn.height}`}
        className="mx-auto block max-w-none"
      >
        <title id={titleId}>Skill tree for {graph.nodes[graph.targetId].title}</title>
        <desc id={descId}>
          {rootTitles.length ? `Root gap: ${rootTitles.join(" and ")}.` : "No root gap found."} The same information is available as a list below the tree.
        </desc>
        <g aria-hidden="true" transform={`translate(${target.x} ${target.y - NODE_H / 2})`}>
          <path d="M0 0 V-14" stroke="var(--leaf)" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M0 -9 C-3 -18 -12 -21 -20 -18 C-18 -10 -9 -6 0 -9 Z" fill="var(--leaf)" />
          <path d="M0 -12 C3 -21 12 -24 19 -21 C17 -13 9 -9 0 -12 Z" fill="var(--leaf)" />
        </g>

        {drawn.edges.map(({ from, to }) => {
          const a = byId[from];
          const b = byId[to];
          const y1 = a.y + NODE_H / 2;
          const y2 = b.y - NODE_H / 2;
          const mid = (y1 + y2) / 2;
          const hot = onPath.has(`${from}>${to}`);
          return (
            <path
              key={`${from}>${to}`}
              d={`M${a.x} ${y1} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${y2}`}
              fill="none"
              stroke={hot ? "var(--sun)" : "var(--soil)"}
              strokeOpacity={hot ? 1 : 0.55}
              strokeWidth={hot ? 3.5 : 1.6}
              strokeLinecap="round"
            />
          );
        })}

        {drawn.nodes.map((n) => {
          const ds = displayStatus(n.id, status, roots);
          const s = STYLE[ds];
          return (
            <g key={n.id} transform={`translate(${n.x - n.w / 2} ${n.y - NODE_H / 2})`}>
              {ds === "root" && <rect x={-5} y={-5} width={n.w + 10} height={NODE_H + 10} rx={16} fill="none" stroke="var(--sun)" strokeWidth={3} />}
              <rect width={n.w} height={NODE_H} rx={12} fill={s.fill} stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} />
              <text x={14} y={NODE_H / 2 + 5} fontSize={14} fontWeight={700} fill={s.stroke} aria-hidden="true">
                {STATUS[ds].icon}
              </text>
              <text x={30} y={NODE_H / 2 + 4.5} fontSize={13} fontWeight={ds === "root" || n.id === graph.targetId ? 700 : 500} fill={s.text}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function TreeLegend() {
  const order: DisplayStatus[] = ["root", "gap", "inferred-gap", "mastered", "inferred-mastered", "untested"];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {order.map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold"
            style={{ background: STYLE[k].fill, color: STYLE[k].stroke, border: `1.5px ${STYLE[k].dash ? "dashed" : "solid"} ${STYLE[k].stroke}` }}
          >
            {STATUS[k].icon}
          </span>
          <span>
            <strong className="font-semibold">{STATUS[k].label}</strong>
            <span className="text-muted">: {STATUS[k].description.toLowerCase()}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The same tree as a nested list: the accessible (and small-screen-friendly) view. */
export function TreeList({ graph, status, roots }: { graph: DiagnosticGraph; status: Record<string, NodeStatus>; roots: ReadonlySet<string> }) {
  const seen = new Set<string>();
  const item = (id: string): React.ReactNode => {
    const skill = graph.nodes[id];
    const ds = displayStatus(id, status, roots);
    const repeat = seen.has(id);
    seen.add(id);
    const kids = repeat ? [] : skill.prereqs.filter((p) => graph.nodes[p]);
    return (
      <li key={id} className="mt-1.5">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="w-4 text-center font-bold" style={{ color: STYLE[ds].stroke }}>
            {STATUS[ds].icon}
          </span>
          <span className={ds === "root" ? "font-bold" : ""}>{skill.title}</span>
          <span className="text-sm text-muted">
            ({STATUS[ds].label}
            {repeat ? ", shown above" : ""})
          </span>
        </span>
        {kids.length > 0 && <ul className="ml-3 border-l border-line pl-4">{kids.map(item)}</ul>}
      </li>
    );
  };
  return <ul>{item(graph.targetId)}</ul>;
}
