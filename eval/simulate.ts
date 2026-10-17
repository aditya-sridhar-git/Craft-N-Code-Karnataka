/**
 * Simulation evaluation of the diagnostic engine (no API key needed).
 *
 * For each featured topic we generate seeded synthetic students with 0–2 true gaps, let each policy
 * diagnose them with noisy answers, and compare the reported root gaps with the true ones.
 *
 *   npm run eval:sim                  # 2,000 students per topic, writes eval/results/simulation.{md,json}
 *   npm run eval:sim -- --students 500
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { SKILLS } from "../src/data/skills";
import { FEATURED } from "../src/data/topics";
import { Diagnoser, DEFAULT_BUDGET, type PolicyName } from "../src/lib/engine/diagnose";
import { buildSubgraph } from "../src/lib/engine/graph";
import { knows, runDiagnosis, trueRoots, type SimStudent } from "../src/lib/engine/simulate";
import { createRng, type Rng } from "../src/lib/questions/rng";

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};
const STUDENTS = arg("students", 2000);
const SEED = arg("seed", 2026);
const SLIP = 0.1;
const UNSURE = 0.4;

type Prior = "uniform" | "grade-weighted";
type Method = PolicyName | "chapter-test";
const METHODS: Method[] = ["split", "topdown", "exhaustive", "chapter-test"];

interface Tally {
  n: number;
  withGap: number;
  exact: number;
  top: number;
  recallSum: number;
  precisionSum: number;
  predicted: number;
  noGap: number;
  falseAlarm: number;
  questions: number[];
}
const empty = (): Tally => ({ n: 0, withGap: 0, exact: 0, top: 0, recallSum: 0, precisionSum: 0, predicted: 0, noGap: 0, falseAlarm: 0, questions: [] });

function sampleGaps(ids: string[], rng: Rng, prior: Prior): Set<string> {
  const r = rng.next();
  const k = r < 0.1 ? 0 : r < 0.7 ? 1 : 2;
  const weight = (id: string) => (prior === "uniform" ? 1 : Math.max(1, SKILLS[id].grade - 5));
  const pool = [...ids];
  const gaps = new Set<string>();
  while (gaps.size < k && pool.length) {
    const total = pool.reduce((s, id) => s + weight(id), 0);
    let x = rng.next() * total;
    let i = 0;
    while ((x -= weight(pool[i])) > 0) i++;
    gaps.add(pool[i]);
    pool.splice(i, 1);
  }
  return gaps;
}

/** What a normal chapter test tells you: 5 questions on the chapter itself. */
function chapterTest(d: Diagnoser, student: SimStudent, rng: Rng) {
  const known = knows(d.index, student.gaps, d.graph.targetId);
  let correct = 0;
  for (let i = 0; i < 5; i++) {
    if (known) correct += rng.chance(student.slip) ? 0 : 1;
    else if (!rng.chance(student.unsure)) correct += rng.chance(0.25) ? 1 : 0;
  }
  return { roots: correct <= 2 ? [d.graph.targetId] : [], questionsAsked: 5 };
}

function score(t: Tally, predicted: string[], truth: Set<string>, questions: number) {
  t.n++;
  t.questions.push(questions);
  const hits = predicted.filter((p) => truth.has(p)).length;
  if (truth.size === 0) {
    t.noGap++;
    if (predicted.length) t.falseAlarm++;
  } else {
    t.withGap++;
    t.recallSum += hits / truth.size;
    if (predicted.length && truth.has(predicted[0])) t.top++;
  }
  if (predicted.length) {
    t.predicted++;
    t.precisionSum += hits / predicted.length;
  }
  if (predicted.length === truth.size && hits === truth.size) t.exact++;
}

function evaluate(prior: Prior, slip: number, methods: Method[], students: number, budget = DEFAULT_BUDGET) {
  const out: Record<string, Record<Method, Tally>> = {};
  for (const topic of FEATURED) {
    const d = new Diagnoser(buildSubgraph(topic.targetId, (id) => SKILLS[id]));
    out[topic.id] = Object.fromEntries(methods.map((m) => [m, empty()])) as Record<Method, Tally>;
    const rng = createRng(SEED);
    for (let s = 0; s < students; s++) {
      const gaps = sampleGaps(d.index.ids, rng, prior);
      const truth = trueRoots(d.index, gaps);
      const student: SimStudent = { gaps, slip, unsure: UNSURE };
      for (const method of methods) {
        // Each method sees the same student with its own (seeded) answer noise.
        const answerRng = createRng(SEED * 7919 + s * 31 + methods.indexOf(method));
        const result =
          method === "chapter-test"
            ? chapterTest(d, student, answerRng)
            : (() => {
                const r = runDiagnosis(d, student, answerRng, { policy: method, budget: method === "exhaustive" ? 1000 : budget });
                return { roots: r.roots.map((x) => x.skillId), questionsAsked: r.questionsAsked };
              })();
        score(out[topic.id][method], result.roots, truth, result.questionsAsked);
      }
    }
  }
  return out;
}

const pct = (x: number, n: number) => (n ? `${((100 * x) / n).toFixed(1)}%` : "–");
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const p90 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(0.9 * (xs.length - 1))] ?? 0;

function merge(tallies: Tally[]): Tally {
  const t = empty();
  for (const x of tallies) {
    for (const k of ["n", "withGap", "exact", "top", "recallSum", "precisionSum", "predicted", "noGap", "falseAlarm"] as const) t[k] += x[k];
    t.questions.push(...x.questions);
  }
  return t;
}

const LABEL: Record<Method, string> = {
  split: "**Taproot (split)**",
  topdown: "Top-down walk",
  exhaustive: "Test every skill",
  "chapter-test": "Chapter test only",
};

function table(rows: [string, Tally][]) {
  const head = "| Method | Exact root match | First reported root is real | Root recall | Root precision | False alarm (no-gap students) | Avg questions | 90th pct questions |\n|---|---|---|---|---|---|---|---|";
  const body = rows.map(
    ([name, t]) =>
      `| ${name} | ${pct(t.exact, t.n)} | ${pct(t.top, t.withGap)} | ${pct(t.recallSum, t.withGap)} | ${pct(t.precisionSum, t.predicted)} | ${pct(t.falseAlarm, t.noGap)} | ${mean(t.questions).toFixed(1)} | ${p90(t.questions)} |`,
  );
  return [head, ...body].join("\n");
}

const started = Date.now();
const main = evaluate("uniform", SLIP, METHODS, STUDENTS);
const weighted = evaluate("grade-weighted", SLIP, ["split", "topdown"], STUDENTS);
const SMALL = Math.max(200, Math.floor(STUDENTS / 2));
const sensitivity = [0.05, 0.1, 0.2].map((slip) => ({ slip, result: evaluate("uniform", slip, ["split"], SMALL) }));
const budgets = [12, 16, 20, 24, 30].map((budget) => ({ budget, result: evaluate("uniform", SLIP, ["split"], SMALL, budget) }));

const overall = (res: typeof main, methods: Method[]) => methods.map((m) => [LABEL[m], merge(Object.values(res).map((r) => r[m]))] as [string, Tally]);

const lines: string[] = [];
lines.push("# Simulation evaluation of the diagnostic engine", "");
lines.push(
  `Generated by \`npm run eval:sim\` (seed ${SEED}, ${STUDENTS.toLocaleString("en-IN")} simulated students per topic, ${FEATURED.length} topics). No real student data is used.`,
  "",
);
lines.push("## How the simulation works", "");
lines.push(
  "- Each simulated student gets 0 gaps (10%), 1 gap (60%) or 2 gaps (30%), placed on random skills in the topic's prerequisite tree (uniform over skills unless stated).",
  "- A skill counts as known only if it isn't a gap and none of its prerequisites are gaps (a conjunctive, DINA-style model). The **true root gaps** are the gaps whose own prerequisites are all known.",
  `- Answers are noisy: a known skill is answered wrongly ${SLIP * 100}% of the time (a slip). For an unknown skill the student picks "I'm not sure" ${UNSURE * 100}% of the time and otherwise guesses among 4 options (25% lucky guesses).`,
  `- Taproot and the top-down walk stop after about ${DEFAULT_BUDGET} questions. "Test every skill" has no limit. "Chapter test only" asks 5 questions on the chapter itself, which is what a normal school test tells you.`,
  "- **Exact root match**: the reported root gaps are exactly the true ones. **First reported root is real**: the top suggestion is a true root (students with a gap). **Recall** and **precision** are per student, averaged.",
  "",
);
lines.push("## All five topics combined", "", table(overall(main, METHODS)), "");
lines.push("## By topic", "");
for (const topic of FEATURED) {
  const n = Object.keys(buildSubgraph(topic.targetId, (id) => SKILLS[id]).nodes).length;
  lines.push(`### ${topic.title} (${n} skills in the tree)`, "", table(METHODS.map((m) => [LABEL[m], main[topic.id][m]])), "");
}
lines.push("## Robustness checks", "");
lines.push(
  "**Gaps weighted towards later classes.** Real students are more likely to have gaps in recent topics than in Class 6 basics. Here a skill's chance of being a gap is proportional to (class − 5).",
  "",
  table(overall(weighted, ["split", "topdown"])),
  "",
);
lines.push("**Careless-slip rate.** Taproot (split), all topics, uniform gaps.", "");
lines.push("| Slip rate | Exact root match | First reported root is real | Root recall | Avg questions |\n|---|---|---|---|---|");
for (const { slip, result } of sensitivity) {
  const t = merge(Object.values(result).map((r) => r.split));
  lines.push(`| ${slip * 100}% | ${pct(t.exact, t.n)} | ${pct(t.top, t.withGap)} | ${pct(t.recallSum, t.withGap)} | ${mean(t.questions).toFixed(1)} |`);
}
lines.push("", "**Question budget.** Taproot (split), all topics. More questions buy accuracy, with diminishing returns.", "");
lines.push("| Budget | Exact root match | First reported root is real | Avg questions | 90th pct questions |\n|---|---|---|---|---|");
for (const { budget, result } of budgets) {
  const t = merge(Object.values(result).map((r) => r.split));
  lines.push(`| ${budget}${budget === DEFAULT_BUDGET ? " (default)" : ""} | ${pct(t.exact, t.n)} | ${pct(t.top, t.withGap)} | ${mean(t.questions).toFixed(1)} | ${p90(t.questions)} |`);
}
lines.push("", `_Ran in ${((Date.now() - started) / 1000).toFixed(1)} s._`, "");

mkdirSync("eval/results", { recursive: true });
writeFileSync("eval/results/simulation.md", lines.join("\n"));
const json = Object.fromEntries(
  Object.entries(main).map(([topic, r]) => [
    topic,
    Object.fromEntries(
      Object.entries(r).map(([m, t]) => [
        m,
        {
          students: t.n,
          exactRootMatch: t.exact / t.n,
          firstRootReal: t.top / Math.max(1, t.withGap),
          rootRecall: t.recallSum / Math.max(1, t.withGap),
          rootPrecision: t.precisionSum / Math.max(1, t.predicted),
          falseAlarm: t.falseAlarm / Math.max(1, t.noGap),
          avgQuestions: mean(t.questions),
          p90Questions: p90(t.questions),
        },
      ]),
    ),
  ]),
);
writeFileSync("eval/results/simulation.json", JSON.stringify({ seed: SEED, studentsPerTopic: STUDENTS, slip: SLIP, unsure: UNSURE, results: json }, null, 2));
console.log(table(overall(main, METHODS)));
console.log(`\nWrote eval/results/simulation.md (${((Date.now() - started) / 1000).toFixed(1)} s)`);
