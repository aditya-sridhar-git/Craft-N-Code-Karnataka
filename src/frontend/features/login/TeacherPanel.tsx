"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { signIn, signUp, whoAmI } from "@/frontend/lib/classroom";
import { MIN_PASSWORD } from "@/shared/classes";
import { field } from "./StudentPanel";

/** Teacher sign-in, or creating a teacher account. */
export function TeacherPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const ids = { name: useId(), email: useId(), password: useId(), hint: useId() };

  // Already signed in? Go straight to the classes.
  useEffect(() => {
    let live = true;
    whoAmI().then((r) => {
      if (!live) return;
      if (r.ok) router.replace("/teacher");
      else setAvailable(r.status !== 503);
    });
    return () => {
      live = false;
    };
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const reply = mode === "signin" ? await signIn(email, password) : await signUp(name, email, password);
    if (!reply.ok) {
      setBusy(false);
      return setError(reply.error);
    }
    router.push("/teacher");
  };

  const toggle = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
  };

  if (available === false) {
    return (
      <p role="status" className="rounded-2xl border border-sun bg-sun-soft p-5">
        Teacher accounts aren&apos;t switched on for this site yet: it needs a database. Students can still run check-ups and send you a report link.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold">{mode === "signin" ? "Teacher sign-in" : "Create a teacher account"}</h2>
      {mode === "signup" && (
        <div>
          <label htmlFor={ids.name} className="font-semibold">
            Your name
          </label>
          <input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={80} className={field} />
        </div>
      )}
      <div>
        <label htmlFor={ids.email} className="font-semibold">
          Email
        </label>
        <input id={ids.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor={ids.password} className="font-semibold">
          Password
        </label>
        <input
          id={ids.password}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={mode === "signup" ? MIN_PASSWORD : 1}
          aria-describedby={mode === "signup" ? ids.hint : undefined}
          className={field}
        />
        {mode === "signup" && (
          <p id={ids.hint} className="mt-1 text-sm text-muted">
            At least {MIN_PASSWORD} characters.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-gap-soft p-3 text-sm">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || available === null} className="w-full rounded-xl bg-leaf px-6 py-3 text-lg font-semibold text-leaf-ink disabled:opacity-60">
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "signin" ? "New to Taproot? " : "Already have an account? "}
        <button type="button" onClick={toggle} className="font-semibold text-ink underline underline-offset-4">
          {mode === "signin" ? "Create a teacher account" : "Sign in instead"}
        </button>
      </p>
    </form>
  );
}
