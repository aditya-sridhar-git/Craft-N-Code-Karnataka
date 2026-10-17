import { describe, expect, it } from "vitest";
import { BANK } from "@/data/bank";
import { SKILLS, SKILL_LIST } from "@/data/skills";
import { FEATURED } from "@/data/topics";
import { buildSubgraph, findCycle } from "@/lib/engine/graph";
import { drawQuestion, GENERATORS } from "@/lib/questions";
import { createRng } from "@/lib/questions/rng";

describe("skill graph", () => {
  it("has unique ids", () => {
    expect(new Set(SKILL_LIST.map((s) => s.id)).size).toBe(SKILL_LIST.length);
  });

  it("only refers to prerequisites that exist", () => {
    for (const s of SKILL_LIST) for (const p of s.prereqs) expect(SKILLS[p], `${s.id} → ${p}`).toBeDefined();
  });

  it("has no cycles", () => {
    expect(findCycle(SKILLS)).toBeNull();
  });

  it("has unique misconception ids within each skill, each with a label and a fix", () => {
    for (const s of SKILL_LIST) {
      const ids = s.misconceptions.map((m) => m.id);
      expect(new Set(ids).size, s.id).toBe(ids.length);
      for (const m of s.misconceptions) {
        expect(m.label.length, `${s.id}/${m.id}`).toBeGreaterThan(5);
        expect(m.fix.length, `${s.id}/${m.id}`).toBeGreaterThan(20);
      }
    }
  });

  it("gives every skill a lesson, a summary and a syllabus reference", () => {
    for (const s of SKILL_LIST) {
      expect(s.lesson.length, s.id).toBeGreaterThan(40);
      expect(s.summary.length, s.id).toBeGreaterThan(10);
      expect(s.ref, s.id).not.toBeNull();
    }
  });
});

describe("featured topics", () => {
  it("point at real skills whose whole subgraph is curated", () => {
    for (const t of FEATURED) {
      const g = buildSubgraph(t.targetId, (id) => SKILLS[id]);
      expect(Object.keys(g.nodes).length, t.id).toBeGreaterThan(5);
      for (const id of Object.keys(g.nodes)) expect(GENERATORS[id]?.length ?? 0, `${t.id}: ${id} has no generator`).toBeGreaterThan(0);
    }
  });
});

describe("question supply", () => {
  it("can produce at least 4 distinct questions for every skill", () => {
    for (const s of SKILL_LIST) {
      const rng = createRng(7);
      const used = new Set<string>();
      for (let i = 0; i < 4; i++) {
        const q = drawQuestion(s.id, rng, used);
        expect(q, `${s.id}: question ${i + 1}`).not.toBeNull();
        used.add(q!.id);
      }
      expect(used.size, s.id).toBe(4);
    }
  });

  it("only tags options with misconceptions that exist on the skill", () => {
    for (const s of SKILL_LIST) {
      const known = new Set(s.misconceptions.map((m) => m.id));
      const rng = createRng(11);
      for (const gen of GENERATORS[s.id] ?? []) {
        for (let i = 0; i < 200; i++) {
          const spec = gen(rng);
          expect(spec.skillId).toBe(s.id);
          for (const d of spec.distractors) if (d.misconceptionId) expect(known.has(d.misconceptionId), `${s.id}: ${d.misconceptionId}`).toBe(true);
        }
      }
    }
    for (const item of BANK) {
      const skill = SKILLS[item.skillId];
      expect(skill, item.id).toBeDefined();
      const known = new Set(skill.misconceptions.map((m) => m.id));
      for (const d of item.distractors) if (d.misconceptionId) expect(known.has(d.misconceptionId), `${item.id}: ${d.misconceptionId}`).toBe(true);
    }
  });

  it("uses every misconception somewhere, so each one can actually be detected", () => {
    const used = new Set<string>();
    const rng = createRng(3);
    for (const [skillId, gens] of Object.entries(GENERATORS))
      for (const gen of gens) for (let i = 0; i < 300; i++) for (const d of gen(rng).distractors) if (d.misconceptionId) used.add(`${skillId}/${d.misconceptionId}`);
    for (const item of BANK) for (const d of item.distractors) if (d.misconceptionId) used.add(`${item.skillId}/${d.misconceptionId}`);
    const missing = SKILL_LIST.flatMap((s) => s.misconceptions.map((m) => `${s.id}/${m.id}`)).filter((k) => !used.has(k));
    expect(missing).toEqual([]);
  });
});
