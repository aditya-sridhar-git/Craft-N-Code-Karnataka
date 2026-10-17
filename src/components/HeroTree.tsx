/** Illustration: a student stuck on projectile motion, traced down to a gap in trig ratios. */
const W = 470;
const NODES = [
  { id: "pm", x: 235, y: 84, w: 168, label: "Projectile motion", kind: "gap" },
  { id: "vc", x: 122, y: 168, w: 160, label: "Vector components", kind: "affected" },
  { id: "em", x: 345, y: 168, w: 166, label: "Equations of motion", kind: "ok" },
  { id: "tr", x: 66, y: 246, w: 112, label: "Trig ratios", kind: "root" },
  { id: "ve", x: 180, y: 246, w: 88, label: "Vectors", kind: "ok" },
  { id: "ac", x: 290, y: 246, w: 116, label: "Acceleration", kind: "inferred" },
  { id: "re", x: 409, y: 246, w: 114, label: "Rearranging", kind: "inferred" },
  { id: "py", x: 58, y: 320, w: 106, label: "Pythagoras", kind: "ok" },
  { id: "ra", x: 168, y: 320, w: 76, label: "Ratio", kind: "ok" },
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
  gap: { fill: "var(--gap-soft)", stroke: "var(--gap)", dash: undefined, icon: "✕" },
  affected: { fill: "var(--affected-soft)", stroke: "var(--affected)", dash: "5 4", icon: "!" },
  root: { fill: "var(--gap-soft)", stroke: "var(--gap)", dash: undefined, icon: "◆" },
  ok: { fill: "var(--ok-soft)", stroke: "var(--ok)", dash: undefined, icon: "✓" },
  inferred: { fill: "var(--surface)", stroke: "var(--ok)", dash: "5 4", icon: "○" },
} as const;

export function HeroTree() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <svg viewBox={`0 0 ${W} 352`} className="h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--soil-soft)" />
          <stop offset="1" stopColor="var(--soil-soft)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect x="0" y="122" width={W} height="230" rx="18" fill="url(#hero-soil)" />
      <line x1="8" x2={W - 8} y1="122" y2="122" stroke="var(--soil)" strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(235 66)">
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
        return (
          <path
            key={`${a}${b}`}
            d={`M${p.x} ${y1} C${p.x} ${mid} ${c.x} ${mid} ${c.x} ${y2}`}
            fill="none"
            stroke={hot ? "var(--sun)" : "var(--soil)"}
            strokeOpacity={hot ? 1 : 0.6}
            strokeWidth={hot ? 4 : 2}
            strokeLinecap="round"
          />
        );
      })}
      {NODES.map((n) => {
        const k = KIND[n.kind];
        return (
          <g key={n.id} transform={`translate(${n.x - n.w / 2} ${n.y - 17})`}>
            {n.kind === "root" && <rect x="-6" y="-6" width={n.w + 12} height="46" rx="17" fill="var(--sun-soft)" stroke="var(--sun)" strokeWidth="3" />}
            <rect width={n.w} height="34" rx="11" fill={k.fill} stroke={k.stroke} strokeWidth={n.kind === "root" ? 3 : 1.6} strokeDasharray={k.dash} />
            <text x="12" y="22" fontSize="13" fontWeight="700" fill={k.stroke}>
              {k.icon}
            </text>
            <text x="27" y="21.5" fontSize="13" fontWeight={n.kind === "root" || n.id === "pm" ? 700 : 500} fill="var(--ink)">
              {n.label}
            </text>
          </g>
        );
      })}
      <text x="66" y="208" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--sun-ink)">
        root gap
      </text>
    </svg>
  );
}
