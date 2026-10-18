import { ExplainRequest } from "@/backend/ai/schemas";
import { explainGap } from "@/backend/ai/pipeline";
import { clientId, hash, json, Memo, rateLimit } from "@/backend/lib/guard";
import { AiError, aiAvailable } from "@/backend/lib/llm";


const memo = new Memo<Awaited<ReturnType<typeof explainGap>>>(400);

/** A short lesson aimed at the misconception the student's wrong answers revealed. */
export async function POST(req: Request) {
  const limit = rateLimit(`explain:${clientId(req)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return json({ error: "Too many requests in a short time. Please wait a few minutes." }, 429, { "retry-after": String(limit.retryAfter) });

  const body = ExplainRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "That request didn't look right." }, 400);
  // No AI: the client falls back to Taproot's curated lesson for the skill.
  if (!aiAvailable()) return json({ error: "AI explanations aren't switched on here." }, 503);

  try {
    const x = body.data;
    const key = hash(JSON.stringify([x.skill.id, x.misconceptionId, x.style, x.needSteps, x.grade, x.target, x.wrong]));
    return json(await memo.get(key, () => explainGap(x)));
  } catch (e) {
    const status = e instanceof AiError ? e.status : 500;
    return json({ error: e instanceof AiError ? e.message : "Something went wrong while writing the explanation." }, status);
  }
}
