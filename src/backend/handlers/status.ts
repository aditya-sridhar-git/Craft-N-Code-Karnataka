import { connection } from "next/server";
import { getStore } from "@/backend/db/store";
import { json } from "@/backend/lib/guard";
import { aiAvailable, isMock } from "@/backend/lib/llm";

/** Whether AI features and teacher accounts/classes are switched on (never reveals keys or connection strings). */
export async function GET() {
  await connection();
  return json({ ai: aiAvailable(), mock: isMock(), classes: getStore() !== null });
}
