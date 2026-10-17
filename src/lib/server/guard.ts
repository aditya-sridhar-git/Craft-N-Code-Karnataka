import "server-only";

/** In-memory sliding-window rate limit per client (per server instance; good enough to protect a free quota). */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return { ok: true };
}

export function clientId(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Small LRU cache with expiry, plus de-duplication of identical requests in flight. */
export class Memo<V> {
  private store = new Map<string, { value: V; at: number }>();
  private inflight = new Map<string, Promise<V>>();
  constructor(
    private max = 300,
    private ttlMs = 12 * 60 * 60 * 1000,
  ) {}

  async get(key: string, make: () => Promise<V>): Promise<V> {
    const hit = this.store.get(key);
    if (hit && Date.now() - hit.at < this.ttlMs) {
      this.store.delete(key);
      this.store.set(key, hit);
      return hit.value;
    }
    const running = this.inflight.get(key);
    if (running) return running;
    const p = make()
      .then((value) => {
        this.store.set(key, { value, at: Date.now() });
        if (this.store.size > this.max) this.store.delete(this.store.keys().next().value!);
        return value;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
}

/** Stable short hash for ids and cache keys. */
export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { "cache-control": "no-store", ...headers } });
