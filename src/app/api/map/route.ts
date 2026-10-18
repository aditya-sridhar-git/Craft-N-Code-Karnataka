export { POST } from "@/backend/handlers/map";

// Groq calls can wait out a rate limit, so allow up to a minute.
export const maxDuration = 60;
