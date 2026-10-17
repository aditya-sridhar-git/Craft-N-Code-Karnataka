/**
 * Browser storage that never throws: storage can be blocked (private windows, strict settings),
 * and Taproot must keep working without it. Everything Taproot saves stays on this device.
 */
type Area = "local" | "session";

function area(which: Area): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return which === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, which: Area = "local"): T | null {
  try {
    const raw = area(which)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown, which: Area = "local"): boolean {
  try {
    area(which)?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string, which: Area = "local") {
  try {
    area(which)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Removes every key Taproot has stored on this device. */
export function clearAll() {
  for (const which of ["local", "session"] as const) {
    const s = area(which);
    if (!s) continue;
    try {
      const keys: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k?.startsWith("taproot:")) keys.push(k);
      }
      for (const k of keys) s.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}
