import { describe, expect, it, vi } from "vitest";

// The AI module is server-only; its guard package is a no-op outside a client bundle.
vi.mock("server-only", () => ({}));
const { normaliseMap } = await import("@/backend/ai/pipeline");

const node = (key: string, prereqs: string[], extra: Partial<{ title: string }> = {}) => ({
  key,
  title: extra.title ?? `Skill ${key}`,
  short: key,
  grade: 10,
  summary: "A summary.",
  prereqs,
  misconceptions: [{ id: "Some Mix-up", label: "Thinks something wrong", fix: "The right idea." }],
  lesson: "A short lesson.",
});

describe("normalising an AI-built skill tree", () => {
  it("links new nodes to checked skills and keeps only what the target reaches", () => {
    const r = normaliseMap(
      {
        ok: true,
        refusal: null,
        title: "Arithmetic progressions",
        subject: "maths",
        plan: [],
        nodes: [node("target", ["n1", "integers", "not-a-skill"]), node("n1", ["fractions"]), node("n2", ["integers"])],
      },
      10,
    );
    if ("refusal" in r) throw new Error("unexpected refusal");
    expect(r.nodes).toHaveLength(2); // n2 isn't reachable from the target
    const target = r.nodes.find((n) => n.id === r.targetId)!;
    expect(target.prereqs).toContain("integers");
    expect(target.prereqs).not.toContain("not-a-skill");
    expect(target.generated).toBe(true);
    expect(target.misconceptions[0].id).toBe("some-mix-up");
  });

  it("breaks cycles between new nodes", () => {
    const r = normaliseMap(
      { ok: true, refusal: null, title: "T", subject: "maths", plan: [], nodes: [node("target", ["n1"]), node("n1", ["n2"]), node("n2", ["n1"])] },
      10,
    );
    if ("refusal" in r) throw new Error("unexpected refusal");
    const n2 = r.nodes.find((n) => n.title === "Skill n2")!;
    const n1 = r.nodes.find((n) => n.title === "Skill n1")!;
    expect(n1.prereqs.includes(n2.id) && n2.prereqs.includes(n1.id)).toBe(false);
  });

  it("adds skills the solution plan uses to the tree, so they get tested", () => {
    const r = normaliseMap(
      {
        ok: true,
        refusal: null,
        title: "Distance under acceleration",
        subject: "physics",
        plan: [
          { step: "Note $u$, $a$ and $t$.", skill: "velocity" },
          { step: "Use $s = ut + \\frac{1}{2}at^2$.", skill: "motion-equations" },
        ],
        nodes: [node("target", ["velocity", "acceleration"])],
      },
      9,
    );
    if ("refusal" in r) throw new Error("unexpected refusal");
    expect(r.nodes[0].prereqs).toContain("motion-equations");
    expect(r.plan.map((p) => p.skillId)).toEqual(["velocity", "motion-equations"]);
  });

  it("passes refusals through", () => {
    const r = normaliseMap({ ok: false, refusal: "Taproot helps with school maths and science.", title: "", subject: "other", plan: [], nodes: [] }, 10);
    expect(r).toEqual({ refusal: "Taproot helps with school maths and science." });
  });
});
