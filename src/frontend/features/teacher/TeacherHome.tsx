"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createClass, signOut, whoAmI } from "@/frontend/lib/classroom";
import { RETENTION_DAYS, type TeacherClass, type TeacherProfile } from "@/shared/classes";

export const classHref = (code: string) => `/teacher/class?c=${code}`;

export function TeacherHome() {
  const router = useRouter();
  const [me, setMe] = useState<{ teacher: TeacherProfile; classes: TeacherClass[] } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();

  useEffect(() => {
    let live = true;
    whoAmI().then((r) => {
      if (!live) return;
      if (r.ok) setMe(r.data);
      else if (r.status === 401) router.replace("/login/teacher");
      else setProblem(r.error);
    });
    return () => {
      live = false;
    };
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Give the class a name, for example “10 B Maths”.");
    setBusy(true);
    setError(null);
    const reply = await createClass(name.trim());
    if (!reply.ok) {
      setBusy(false);
      return setError(reply.error);
    }
    router.push(classHref(reply.data.code));
  };

  const leave = async () => {
    await signOut();
    router.replace("/login");
  };

  if (problem) {
    return (
      <p role="alert" className="mx-auto max-w-xl rounded-2xl border border-sun bg-sun-soft p-5">
        {problem}
      </p>
    );
  }
  if (!me) return <p className="text-muted">Loading your classes…</p>;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <p className="text-sm font-semibold tracking-wide text-soil uppercase">Teacher</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Hello, {me.teacher.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">Signed in as {me.teacher.email}</p>
        </div>
        <button type="button" onClick={leave} className="rounded-xl border border-line bg-surface px-4 py-2 font-semibold hover:border-leaf hover:text-leaf">
          Sign out
        </button>
      </div>

      <section aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="font-display text-2xl font-semibold">
          Your classes
        </h2>
        {me.classes.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line p-6 text-muted">
            No classes yet. Make one below, then give your students its code. They join at <strong className="text-ink">Log in → I&apos;m a student</strong>.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {me.classes.map((c) => (
              <li key={c.code}>
                <Link href={classHref(c.code)} className="lift flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold">{c.name}</p>
                    <p className="font-mono text-sm tracking-widest text-muted">{c.code}</p>
                  </div>
                  <p className="text-right">
                    <span className="block font-display text-2xl font-semibold">{c.results}</span>
                    <span className="text-sm text-muted">{c.results === 1 ? "check-up" : "check-ups"}</span>
                  </p>
                  <span aria-hidden="true" className="text-leaf">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <h2 className="font-display text-2xl font-semibold">Make a class</h2>
        <label htmlFor={nameId} className="mt-4 block font-semibold">
          Class name
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="e.g. 10 B Maths"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-lg sm:max-w-sm"
          />
          <button type="submit" disabled={busy} className="rounded-xl bg-leaf px-6 py-2.5 font-semibold text-leaf-ink disabled:opacity-60">
            {busy ? "Making…" : "Make class"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Use a class name, not students&apos; names. Results are deleted automatically after {RETENTION_DAYS} days.</p>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-gap-soft p-3 text-sm">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
