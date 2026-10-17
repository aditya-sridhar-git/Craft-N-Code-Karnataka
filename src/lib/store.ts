"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny store: the in-memory value is the source of truth, persisted to localStorage when it
 * is available. If storage is blocked, Taproot keeps working for the current visit.
 */
export interface Store<T> {
  get(): T | null;
  set(value: T | null): void;
  subscribe(listener: () => void): () => void;
}

export function createLocalStore<T>(key: string): Store<T> {
  let memory: { value: T | null } | undefined;
  const listeners = new Set<() => void>();

  const load = (): T | null => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  return {
    get() {
      if (typeof window === "undefined") return null;
      if (memory === undefined) memory = { value: load() };
      return memory.value;
    },
    set(value) {
      memory = { value };
      try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: keep the in-memory value */
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) {
          memory = undefined;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

/** Returns undefined while server rendering / hydrating, then the stored value (or null). */
export function useStore<T>(store: Store<T>): T | null | undefined {
  return useSyncExternalStore(store.subscribe, store.get, () => undefined);
}
