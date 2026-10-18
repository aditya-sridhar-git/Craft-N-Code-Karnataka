"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { findClass, joinedStore } from "@/frontend/lib/classroom";
import { useStore } from "@/frontend/lib/store";
import { CODE_LENGTH, normaliseCode } from "@/shared/classes";

export const field = "mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-lg";

/** Students "log in" with a class code only: there is no student account and no password. */
export function StudentPanel() {
  const router = useRouter();
  const joined = useStore(joinedStore);
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const ids = { code: useId(), nick: useId(), codeHint: useId(), nickHint: useId() };

  useEffect(() => {
    let live = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { classes?: boolean }) => live && setAvailable(Boolean(d.classes)))
      .catch(() => live && setAvailable(false));
    return () => {
      live = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normaliseCode(code);
    if (clean.length !== CODE_LENGTH) return setError(`A class code has ${CODE_LENGTH} letters and numbers.`);
    setBusy(true);
    setError(null);
    const reply = await findClass(clean);
    if (!reply.ok) {
      setBusy(false);
      return setError(reply.error);
    }
    joinedStore.set({ ...reply.data, nickname: nickname.trim().slice(0, 30) || undefined });
    router.push("/start");
  };

  if (joined === undefined) return <p className="text-center text-muted">Loading…</p>;

  if (joined) {
    return (
      <div className="rounded-2xl bg-leaf-soft p-5">
        <p className="font-semibold">Hi{joined.nickname ? `, ${joined.nickname}` : ""}!</p>
        <p className="mt-1 leading-relaxed">
          You&apos;re in the class <strong>{joined.name}</strong>. Each check-up you finish is shared with your teacher: the chapter, the root gap and the mix-up. Never your name or your answers.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/start" className="rounded-xl bg-leaf px-5 py-2.5 font-semibold text-leaf-ink">
            Start a check-up
          </Link>
          <button type="button" onClick={() => joinedStore.set(null)} className="rounded-xl border border-line bg-surface px-4 py-2.5 font-semibold">
            Leave class
          </button>
        </div>
      </div>
    );
  }

  if (available === false) {
    return (
      <p role="status" className="rounded-2xl border border-sun bg-sun-soft p-5">
        Classes aren&apos;t switched on for this site yet. You can still run a check-up on your own.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={ids.code} className="font-semibold">
          Class code
        </label>
        <input
          id={ids.code}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="e.g. K7Q3MX"
          aria-describedby={ids.codeHint}
          aria-invalid={error ? true : undefined}
          className={`${field} font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case`}
        />
        <p id={ids.codeHint} className="mt-1 text-sm text-muted">
          Your teacher gives you this. It has {CODE_LENGTH} letters and numbers.
        </p>
      </div>
      <div>
        <label htmlFor={ids.nick} className="font-semibold">
          What should we call you? <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id={ids.nick} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" maxLength={30} aria-describedby={ids.nickHint} className={field} />
        <p id={ids.nickHint} className="mt-1 text-sm text-muted">
          Only saved on this device to greet you. Never sent to your teacher or anyone else.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-gap-soft p-3 text-sm">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || available === null} className="w-full rounded-xl bg-leaf px-6 py-3 text-lg font-semibold text-leaf-ink disabled:opacity-60">
        {busy ? "Checking…" : "Join class"}
      </button>
      <p className="text-center text-sm text-muted">Students don&apos;t need an account or a password.</p>
    </form>
  );
}
