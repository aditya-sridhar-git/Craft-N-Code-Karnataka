"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/frontend/components/Logo";
import { StudentPanel } from "./StudentPanel";
import { TeacherPanel } from "./TeacherPanel";

export type Role = "student" | "teacher";

const ROLES: { id: Role; icon: string; label: string; hint: string }[] = [
  { id: "student", icon: "🎒", label: "Student", hint: "Join with a class code" },
  { id: "teacher", icon: "🍎", label: "Teacher", hint: "Sign in to your classes" },
];

/** The dedicated login page: one card, a student/teacher switch, and the matching form. */
export function LoginPage({ initial }: { initial: Role }) {
  const [role, setRole] = useState<Role>(initial);

  const choose = (next: Role) => {
    setRole(next);
    // Keep the address in step, so the page can be shared or reloaded on the same side.
    window.history.replaceState(null, "", `/login/${next}`);
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center pb-10">
      <div aria-hidden="true" className="login-backdrop pointer-events-none fixed inset-0 -z-10" />
      <div className="rise w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit flex-col items-center gap-2 rounded-2xl p-2 text-ink" aria-label="Taproot home">
          <Logo className="h-20 w-20 drop-shadow-sm" />
          <span className="font-display text-4xl font-semibold tracking-tight">Taproot</span>
        </Link>
        <p className="mt-1 text-center text-muted">Find the real reason you&apos;re stuck.</p>

        <div className="mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lg shadow-leaf/5 sm:p-7">
          <h1 className="text-center font-display text-2xl font-semibold">Log in</h1>
          <div role="group" aria-label="I am a" className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1.5">
            {ROLES.map((r) => {
              const on = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(r.id)}
                  className={[
                    "flex flex-col items-center rounded-xl px-3 py-3 transition-all active:scale-[0.98]",
                    on ? "bg-surface shadow-sm ring-2 ring-leaf" : "text-muted hover:bg-surface/60 hover:text-ink",
                  ].join(" ")}
                >
                  <span aria-hidden="true" className="text-2xl">
                    {r.icon}
                  </span>
                  <span className={`mt-1 font-semibold ${on ? "text-ink" : ""}`}>{r.label}</span>
                  <span className="text-xs">{r.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">{role === "student" ? <StudentPanel /> : <TeacherPanel />}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Just checking yourself?{" "}
          <Link href="/start" className="font-semibold text-ink underline underline-offset-4">
            Start a check-up without logging in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            ← Back to Taproot
          </Link>
        </p>
      </div>
    </div>
  );
}
