import { MapRequest } from "@/lib/ai/schemas";
import { mapTopic, type MapResult } from "@/lib/server/ai";
import { clientId, hash, json, Memo, rateLimit } from "@/lib/server/guard";
import { AiError, aiAvailable } from "@/lib/server/llm";

export const maxDuration = 60;

const memo = new Memo<MapResult | { refusal: string }>(200);

/** Turns a topic or a pasted problem into a prerequisite tree linked to Taproot's curated skills. */
export async function POST(req: Request) {
  const limit = rateLimit(`map:${clientId(req)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return json({ error: "Too many new topics in a short time. Please wait a few minutes." }, 429, { "retry-after": String(limit.retryAfter) });

  const body = MapRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "Please type a topic (or paste a problem) of 3 to 1,200 characters, and choose your class." }, 400);
  if (!aiAvailable()) return json({ error: "Custom topics need the AI service, which isn't switched on here. The featured chapters work fully." }, 503);

  const { mode, text, grade } = body.data;
  try {
    const key = hash(`${mode}|${grade}|${text.toLowerCase().replace(/\s+/g, " ")}`);
    const result = await memo.get(key, () => mapTopic(mode, text, grade));
    return json(result);
  } catch (e) {
    const status = e instanceof AiError ? e.status : 500;
    return json({ error: e instanceof AiError ? e.message : "Something went wrong while mapping that topic." }, status);
  }
}
