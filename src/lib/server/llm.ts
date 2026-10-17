import "server-only";
import Groq from "groq-sdk";
import type { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";
import { z } from "zod";

/** Models that support Groq's strict (constrained-decoding) JSON schema mode. */
const STRICT = new Set(["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "meta-models/muse-spark-open"]);

const list = (value: string | undefined, fallback: string[]) =>
  value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

/**
 * Fallback chains. On Groq's free tier each model has its own limit (8,000 tokens a minute,
 * 1,000 requests a day), so a 429 on one model moves on to the next.
 */
export const CHAINS = {
  generate: () => list(process.env.GROQ_GENERATE_MODELS, ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]),
  verify: () => list(process.env.GROQ_VERIFY_MODELS, ["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]),
};

export const isMock = () => process.env.LLM_MOCK === "1";
export const aiAvailable = () => isMock() || Boolean(process.env.GROQ_API_KEY);

export class AiError extends Error {
  constructor(
    message: string,
    readonly status = 503,
  ) {
    super(message);
  }
}

let client: Groq | null = null;
const groq = () => (client ??= new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 0, timeout: 25_000 }));

const DROP = new Set(["$schema", "minLength", "maxLength", "pattern", "format", "minItems", "maxItems", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "default"]);

/** zod → JSON Schema for Groq strict mode. Limits stay in zod/normalisation and are checked after parsing. */
export function toStrictSchema(schema: z.ZodType): Record<string, unknown> {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (DROP.has(k)) continue;
      out[k] = k === "properties" ? Object.fromEntries(Object.entries(v as object).map(([pk, pv]) => [pk, walk(pv)])) : walk(v);
    }
    if (out.type === "object" && out.properties) {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties as object);
    }
    return out;
  };
  return walk(z.toJSONSchema(schema)) as Record<string, unknown>;
}

function describe(e: unknown) {
  if (e instanceof Groq.APIError) return `${e.status ?? "network"} ${e.message.slice(0, 120)}`;
  if (e instanceof SyntaxError) return "invalid JSON";
  return e instanceof Error ? e.message.slice(0, 120) : String(e);
}

export interface JsonCall<T> {
  task: string;
  schema: z.ZodType<T>;
  system: string;
  user: string;
  chain: string[];
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
  temperature?: number;
}

/**
 * Calls each model in the chain until one returns JSON that matches the schema.
 * Logs only metadata (task, model, timing, token counts), never request or response content.
 */
export async function generateJSON<T>(call: JsonCall<T>): Promise<{ data: T; model: string }> {
  if (!process.env.GROQ_API_KEY) throw new AiError("AI isn't switched on for this copy of Taproot.");
  const started = Date.now();
  const first = await tryChain(call);
  if ("data" in first) return first;
  // Every model was busy. Free-tier token limits refill continuously, so wait the few seconds
  // Groq asks for (retry-after) and go round the chain once more.
  if (first.retryAfter !== null && Date.now() - started < 30_000) {
    await new Promise((r) => setTimeout(r, Math.min(12, Math.max(1, first.retryAfter!)) * 1000));
    const second = await tryChain(call);
    if ("data" in second) return second;
    first.failures.push(...second.failures);
  }
  console.warn(JSON.stringify({ ai: call.task, failed: first.failures }));
  throw new AiError("The AI service is busy right now. Please try again in a minute.");
}

async function tryChain<T>(call: JsonCall<T>): Promise<{ data: T; model: string } | { failures: string[]; retryAfter: number | null }> {
  const schema = toStrictSchema(call.schema);
  const failures: string[] = [];
  let retryAfter: number | null = null;
  for (const model of call.chain) {
    const started = Date.now();
    const strict = STRICT.has(model);
    const params: ChatCompletionCreateParamsNonStreaming = {
      model,
      temperature: call.temperature ?? 0.4,
      max_completion_tokens: call.maxTokens ?? 3000,
      messages: [
        { role: "system", content: strict ? call.system : `${call.system}\n\nReply with one JSON object that matches this JSON Schema:\n${JSON.stringify(schema)}` },
        { role: "user", content: call.user },
      ],
      response_format: strict ? { type: "json_schema", json_schema: { name: call.task, strict: true, schema } } : { type: "json_object" },
    };
    if (model.startsWith("openai/gpt-oss")) {
      params.reasoning_effort = call.effort ?? "low";
      params.include_reasoning = false;
    } else if (model.startsWith("qwen/")) {
      params.reasoning_effort = call.effort ?? "low";
      params.reasoning_format = "hidden";
    }
    try {
      const res = await groq().chat.completions.create(params);
      const parsed = call.schema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? ""));
      if (!parsed.success) {
        failures.push(`${model}: schema mismatch`);
        continue;
      }
      console.info(
        JSON.stringify({ ai: call.task, model, ms: Date.now() - started, in: res.usage?.prompt_tokens, out: res.usage?.completion_tokens }),
      );
      return { data: parsed.data, model };
    } catch (e) {
      if (e instanceof Groq.AuthenticationError) throw new AiError("The AI service rejected the API key.");
      if (e instanceof Groq.RateLimitError) {
        const wait = Number(e.headers?.get("retry-after"));
        if (Number.isFinite(wait)) retryAfter = retryAfter === null ? wait : Math.min(retryAfter, wait);
        else retryAfter ??= 5;
      }
      // Rate limits (429), timeouts, server errors and retired models all move on to the next model.
      failures.push(`${model}: ${describe(e)}`);
    }
  }
  return { failures, retryAfter };
}
