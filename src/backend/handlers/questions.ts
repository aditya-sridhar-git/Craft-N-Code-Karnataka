import { QuestionsRequest } from "@/backend/ai/schemas";
import { makeQuestions, type QuestionBatch } from "@/backend/ai/pipeline";
import { clientId, hash, json, Memo, rateLimit } from "@/backend/lib/guard";
import { AiError, aiAvailable } from "@/backend/lib/llm";


const memo = new Memo<QuestionBatch>(400);

/** Writes questions for an AI-made skill and keeps only those an independent model answers the same way. */
export async function POST(req: Request) {
  const limit = rateLimit(`questions:${clientId(req)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return json({ error: "Too many requests in a short time. Please wait a few minutes." }, 429, { "retry-after": String(limit.retryAfter) });

  const body = QuestionsRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "That request didn't look right." }, 400);
  if (!aiAvailable()) return json({ error: "The AI service isn't switched on here." }, 503);

  const { skill, context } = body.data;
  try {
    const batch = await memo.get(hash(`${skill.id}|${skill.title}|${skill.summary}`), () => makeQuestions(skill, context));
    if (!batch.questions.length) return json({ error: "None of the AI-written questions passed the double-check, so none are shown." }, 502);
    return json({ questions: batch.questions, written: batch.written, verified: batch.verified });
  } catch (e) {
    const status = e instanceof AiError ? e.status : 500;
    return json({ error: e instanceof AiError ? e.message : "Something went wrong while writing questions." }, status);
  }
}
