"use client";

import { useState } from "react";

/** Illustration: a student stuck on projectile motion, traced down to a gap in trig ratios.
 *  The trace animates in; each skill can be hovered, tapped or focused to see what Taproot found. */
const W = 470;
const NODES = [
  { id: "pm", x: 235, y: 84, w: 168, label: "Projectile motion", kind: "gap", note: "The chapter the student is stuck on. Re-reading it won't help: the trouble is further down." },
  { id: "vc", x: 122, y: 168, w: 160, label: "Vector components", kind: "affected", note: "Failed, but only because it's built on trig ratios. Fix the root and this follows." },
  { id: "em", x: 345, y: 168, w: 166, label: "Equations of motion", kind: "ok", note: "Passed. Everything underneath it is marked solid without asking." },
  { id: "tr", x: 66, y: 246, w: 112, label: "Trig ratios", kind: "root", note: "The root gap: failed, while its own foundations are solid. The mix-up: swapping sine and cosine." },
  { id: "ve", x: 180, y: 246, w: 88, label: "Vectors", kind: "ok", note: "Passed. The vector idea itself is fine." },
  { id: "ac", x: 290, y: 246, w: 116, label: "Acceleration", kind: "inferred", note: "Never asked: passing equations of motion shows this is solid." },
  { id: "re", x: 409, y: 246, w: 114, label: "Rearranging", kind: "inferred", note: "Never asked: passing equations of motion shows this is solid." },
  { id: "py", x: 58, y: 320, w: 106, label: "Pythagoras", kind: "ok", note: "Passed. A solid foundation under trig ratios." },
  { id: "ra", x: 168, y: 320, w: 76, label: "Ratio", kind: "ok", note: "Passed. A solid foundation under trig ratios." },
] as const;

const EDGES = [
  ["pm", "vc", true],
  ["pm", "em", false],
  ["vc", "tr", true],
  ["vc", "ve", false],
  ["em", "ac", false],
  ["em", "re", false],
  ["tr", "py", false],
  ["tr", "ra", false],
] as const;

const KIND = {
  gap: { fill: "var(--gap-soft)", stroke: "var(--gap)", dash: undefined, icon: "✕", word: "stuck here" },
  affected: { fill: "var(--affected-soft)", stroke: "var(--affected)", dash: "5 4", icon: "!", word: "affected" },
  root: { fill: "var(--gap-soft)", stroke: "var(--gap)", dash: undefined, icon: "◆", word: "root gap" },
  ok: { fill: "var(--ok-soft)", stroke: "var(--ok)", dash: undefined, icon: "✓", word: "solid" },
  inferred: { fill: "var(--surface)", stroke: "var(--ok)", dash: "5 4", icon: "○", word: "solid (worked out)" },
} as const;

// Order the trace reveals nodes in: top down, the hot path first.
const ORDER: Record<string, number> = { pm: 0, vc: 1, em: 2, tr: 3, ve: 4, ac: 5, re: 6, py: 7, ra: 8 };

export function HeroTree() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const [active, setActive] = useState<string>("tr");
  const [run, setRun] = useState(0);
  const current = byId[active];

  return (
    <div>
      <svg key={run} viewBox={`0 0 ${W} 352`} className="hero-tree h-auto w-full" role="group" aria-label="Example skill tree. Choose a skill to see what Taproot found.">
        <defs>
          <linearGradient id="hero-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--soil-soft)" />
            <stop offset="1" stopColor="var(--soil-soft)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect x="0" y="122" width={W} height="230" rx="18" fill="url(#hero-soil)" />
        <line x1="8" x2={W - 8} y1="122" y2="122" stroke="var(--soil)" strokeWidth="2.5" strokeLinecap="round" />
        <g transform="translate(235 66)" className="hero-sprout">
          <path d="M0 0 V-26" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 -16 C-5 -32 -21 -37 -35 -32 C-31 -18 -16 -11 0 -16 Z" fill="var(--leaf)" />
          <path d="M0 -22 C5 -38 21 -43 33 -38 C30 -24 16 -17 0 -22 Z" fill="var(--leaf)" />
        </g>
        {EDGES.map(([a, b, hot]) => {
          const p = byId[a];
          const c = byId[b];
          const y1 = p.y + 17;
          const y2 = c.y - 17;
          const mid = (y1 + y2) / 2;
          const lit = active === a || active === b;
          return (
            <path
              key={`${a}${b}`}
              d={`M${p.x} ${y1} C${p.x} ${mid} ${c.x} ${mid} ${c.x} ${y2}`}
              pathLength={1}
              className="hero-edge"
              style={{ animationDelay: `${120 + ORDER[b] * 140}ms` }}
              fill="none"
              stroke={hot ? "var(--sun)" : "var(--soil)"}
              strokeOpacity={hot || lit ? 1 : 0.6}
              strokeWidth={hot ? 4 : lit ? 3 : 2}
              strokeLinecap="round"
            />
          );
        })}
        {NODES.map((n) => {
          const k = KIND[n.kind];
          const on = active === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x - n.w / 2} ${n.y - 17})`}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}: ${k.word}`}
              aria-pressed={on}
              onMouseEnter={() => setActive(n.id)}
              onFocus={() => setActive(n.id)}
              onClick={() => setActive(n.id)}
              className="hero-node cursor-pointer outline-none"
            >
              <g className="hero-pop" style={{ animationDelay: `${ORDER[n.id] * 140}ms` }}>
                {n.kind === "root" && <rect className="hero-halo" x="-6" y="-6" width={n.w + 12} height="46" rx="17" fill="var(--sun-soft)" stroke="var(--sun)" strokeWidth="3" />}
                <rect
                  width={n.w}
                  height="34"
                  rx="11"
                  fill={k.fill}
                  stroke={on ? "var(--focus)" : k.stroke}
                  strokeWidth={on ? 3 : n.kind === "root" ? 3 : 1.6}
                  strokeDasharray={on ? undefined : k.dash}
                />
                <text x="12" y="22" fontSize="13" fontWeight="700" fill={k.stroke}>
                  {k.icon}
                </text>
                <text x="27" y="21.5" fontSize="13" fontWeight={n.kind === "root" || n.id === "pm" ? 700 : 500} fill="var(--ink)">
                  {n.label}
                </text>
              </g>
            </g>
          );
        })}
        <text x="66" y="208" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--sun-ink)" className="hero-pop" style={{ animationDelay: "560ms" }}>
          root gap
        </text>
      </svg>
      <div className="mt-2 flex items-start gap-3 rounded-xl bg-surface-2 p-3 text-sm">
        <p aria-live="polite" className="min-h-[2.75rem] flex-1 leading-snug">
          <span className="font-semibold">
            {current.label} · {KIND[current.kind].word}.
          </span>{" "}
          {current.note}
        </p>
        <button
          type="button"
          onClick={() => {
            setRun((r) => r + 1);
            setActive("tr");
          }}
          className="shrink-0 rounded-lg border border-line bg-surface px-3 py-1.5 font-semibold hover:border-leaf hover:text-leaf active:scale-95"
        >
          ↻ Replay
        </button>
      </div>
    </div>
  );
}
