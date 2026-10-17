import { connection } from "next/server";
import { json } from "@/lib/server/guard";
import { aiAvailable, isMock } from "@/lib/server/llm";

/** Whether AI features are switched on (never reveals the key itself). */
export async function GET() {
  await connection();
  return json({ ai: aiAvailable(), mock: isMock() });
}
