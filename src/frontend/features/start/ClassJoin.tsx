"use client";

import { useId, useState } from "react";
import { findClass, joinedStore } from "@/frontend/lib/classroom";
import { useStore } from "@/frontend/lib/store";
import { CODE_LENGTH, normaliseCode } from "@/shared/classes";

/** Optional: join a teacher's class so finished check-ups are shared with it (without a name). */
export function ClassJoin() {
  const joined = useStore(joinedStore);
  // A teacher can share /start?class=CODE: open the panel with the code filled in.
  // (This panel only renders after the page has loaded, so reading the URL here is safe.)
  const [fromLink] = useState(() => normaliseCode(new URLSearchParams(window.location.search).get("class") ?? "").slice(0, CODE_LENGTH));
  const [open, setOpen] = useState(Boolean(fromLink));
  const [code, setCode] = useState(fromLink);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const noteId = useId();

  if (joined === undefined) return null;

  if (joined) {
    return (
      <div className="rise flex flex-col gap-3 rounded-2xl border border-leaf bg-leaf-soft p-5 sm:flex-row sm:items-center">
        <p className="flex-1">
          {joined.nickname ? `Hi, ${joined.nickname}! ` : ""}You&apos;re in the class <strong>{joined.name}</strong>. Each check-up you finish is shared with your teacher: the chapter, the root gap and the mix-up. Never your name or your answers.
        </p>
        <button type="button" onClick={() => joinedStore.set(null)} className="shrink-0 rounded-xl border border-line bg-surface px-4 py-2 font-semibold">
          Leave class
        </button>
      </div>
    );
  }

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normaliseCode(code);
    if (clean.length !== CODE_LENGTH) return setError(`A class code has ${CODE_LENGTH} letters and numbers.`);
    setBusy(true);
    setError(null);
    const reply = await findClass(clean);
    setBusy(false);
    if (!reply.ok) return setError(reply.error);
    joinedStore.set(reply.data);
  };

  if (!open) {
    return (
      <p>
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg font-semibold text-leaf underline underline-offset-4">
          Has your teacher given you a class code?
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={join} className="rise rounded-2xl border border-line bg-surface p-5">
      <label htmlFor={inputId} className="font-semibold">
        Class code
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id={inputId}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="e.g. K7Q3MX"
          aria-describedby={noteId}
          aria-invalid={error ? true : undefined}
          className="w-44 rounded-xl border border-line bg-paper px-4 py-2.5 font-mono text-lg tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
        />
        <button type="submit" disabled={busy} className="rounded-xl bg-leaf px-5 py-2.5 font-semibold text-leaf-ink disabled:opacity-60">
          {busy ? "Checking…" : "Join class"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold text-muted hover:text-ink">
          Cancel
        </button>
      </div>
      <p id={noteId} className="mt-2 text-sm text-muted">
        Your teacher will see the outcome of each check-up you finish (chapter, root gap, mix-up), never your name or answers. You can leave the class any time.
      </p>
      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-gap-soft p-3 text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
