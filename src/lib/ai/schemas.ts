import { z } from "zod";

/*
 * Schemas for what the AI returns. Only types are enforced here (sent to Groq as a strict JSON
 * schema); lengths and limits are clamped afterwards during normalisation.
 */
export const MapOutput = z.object({
  ok: z.boolean(),
  refusal: z.string().nullable(),
  title: z.string(),
  subject: z.enum(["maths", "physics", "chemistry", "other"]),
  plan: z.array(z.object({ step: z.string(), skill: z.string() })),
  nodes: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      short: z.string(),
      grade: z.number(),
      summary: z.string(),
      prereqs: z.array(z.string()),
      misconceptions: z.array(z.object({ id: z.string(), label: z.string(), fix: z.string() })),
      lesson: z.string(),
    }),
  ),
});
export type MapOutput = z.infer<typeof MapOutput>;

export const QuestionsOutput = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.object({ text: z.string(), misconception: z.string().nullable() })),
      correct: z.number().int(),
      explanation: z.string(),
    }),
  ),
});
export type QuestionsOutput = z.infer<typeof QuestionsOutput>;

export const VerifyOutput = z.object({
  answers: z.array(z.object({ question: z.number().int(), choice: z.number().int() })),
});

export const ExplainOutput = z.object({
  title: z.string(),
  explanation: z.string(),
  steps: z.array(z.string()),
  tip: z.string(),
});
export type ExplainOutput = z.infer<typeof ExplainOutput>;

/* ── API request bodies (validated strictly) ── */

const subject = z.enum(["maths", "physics", "chemistry", "other"]);

export const SkillInput = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  summary: z.string().max(300),
  grade: z.number().int().min(1).max(12),
  subject,
  lesson: z.string().max(1500).optional(),
  misconceptions: z.array(z.object({ id: z.string().max(60), label: z.string().max(200), fix: z.string().max(600) })).max(6),
});
export type SkillInput = z.infer<typeof SkillInput>;

export const MapRequest = z.object({
  mode: z.enum(["topic", "problem"]),
  text: z.string().trim().min(3).max(1200),
  grade: z.number().int().min(6).max(12),
});

export const QuestionsRequest = z.object({ skill: SkillInput, context: z.string().max(200) });

export const ExplainRequest = z.object({
  skill: SkillInput,
  misconceptionId: z.string().max(60).nullable(),
  wrong: z.array(z.object({ prompt: z.string().max(600), chosen: z.string().max(300), answer: z.string().max(300) })).max(3),
  target: z.string().max(120),
  path: z.array(z.string().max(120)).max(12),
  grade: z.number().int().min(1).max(12),
  style: z.enum(["first", "another-way"]),
  needSteps: z.boolean(),
});
