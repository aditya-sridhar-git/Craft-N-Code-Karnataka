"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { loadClass, removeClass } from "@/frontend/lib/classroom";
import { RETENTION_DAYS, summariseGaps, type ClassView } from "@/shared/classes";

const CONFIDENCE = { high: "High", medium: "Medium", low: "Low" } as const;

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          })
          .catch(() => {})
      }
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-leaf hover:text-leaf active:scale-95"
    >
      <span aria-live="polite">{done ? "✓ Copied" : label}</span>
    </button>
  );
}

export function ClassDashboard() {
  const router = useRouter();
  const code = useSearchParams().get("c");
  const [view, setView] = useState<ClassView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const load = useCallback(
    (c: string) =>
      loadClass(c).then((reply) => {
        setLoading(false);
        if (reply.ok) {
          setError(null);
          return setView(reply.data);
        }
        if (reply.status === 401) return router.replace("/login/teacher");
        setError(reply.error);
      }),
    [router],
  );

  useEffect(() => {
    if (code) void load(code);
  }, [code, load]);

  const refresh = () => {
    if (!code) return;
    setLoading(true);
    void load(code);
  };

  if (deleted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6" role="status">
        <h1 className="font-display text-2xl font-semibold">Class deleted</h1>
        <p className="mt-2 text-muted">The class and every result in it have been removed. Its code no longer works.</p>
        <Link href="/teacher" className="mt-4 inline-block rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
          Back to your classes
        </Link>
      </div>
    );
  }

  if (!code || (error && !view)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold">Can&apos;t open this class</h1>
        <p role="alert" className="mt-2 text-muted">
          {error ?? "No class was chosen."}
        </p>
        <Link href="/teacher" className="mt-4 inline-block rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
          Your classes
        </Link>
      </div>
    );
  }

  if (!view) return <p className="text-muted">Loading your class…</p>;

  const results = view.results;
  const gaps = summariseGaps(results);
  const withGap = results.filter((r) => !r.noGap).length;
  const top = gaps[0]?.count ?? 0;
  const joinLink = `${window.location.origin}/start?class=${view.code}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <Link href="/teacher" className="text-sm font-semibold text-muted hover:text-ink">
            ← Your classes
          </Link>
          <p className="mt-3 text-sm font-semibold tracking-wide text-soil uppercase">Class dashboard</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{view.name}</h1>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-xl border border-line bg-surface px-4 py-2 font-semibold hover:border-leaf hover:text-leaf disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <section aria-labelledby="share-heading" className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <div>
          <h2 id="share-heading" className="text-sm font-semibold text-muted">
            Students join with
          </h2>
          <p className="mt-1 font-mono text-4xl font-semibold tracking-[0.2em]" aria-label={`Class code ${view.code.split("").join(" ")}`}>
            {view.code}
          </p>
        </div>
        <div className="space-y-2 sm:justify-self-end sm:text-right">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <CopyButton text={view.code} label="Copy code" />
            <CopyButton text={joinLink} label="Copy student link" />
          </div>
          <p className="text-sm text-muted">Students enter the code at Log in → I&apos;m a student, or open the student link.</p>
        </div>
      </section>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ["Check-ups finished", String(results.length)],
          ["Found a root gap", String(withGap)],
          ["No gap found", String(results.length - withGap)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">{label}</dt>
            <dd className="mt-1 font-display text-4xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-lg font-semibold">No check-ups yet</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Share the code <strong className="font-mono">{view.code}</strong> or the student link. Results appear here as soon as a student finishes a check-up. Press Refresh to update.
          </p>
        </div>
      ) : (
        <>
          <section aria-labelledby="reteach-heading">
            <h2 id="reteach-heading" className="font-display text-2xl font-semibold">
              What to re-teach
            </h2>
            <p className="mt-1 text-muted">Root gaps across the class, most common first.</p>
            {gaps.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-ok-soft p-5">✓ No root gaps so far: every finished check-up came back solid.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {gaps.map((g, i) => (
                  <li key={g.rootTitle} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-lg font-semibold text-muted">{i + 1}.</span>
                      <h3 className="mr-auto text-lg font-semibold">{g.rootTitle}</h3>
                      <span className="font-semibold">
                        {g.count} of {results.length} check-ups
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full rounded bg-surface-2" aria-hidden="true">
                      <div className="h-full rounded bg-leaf" style={{ width: `${Math.max(4, (g.count / top) * 100)}%` }} />
                    </div>
                    {g.misconceptions.length > 0 && (
                      <p className="mt-3 text-sm">
                        <span className="font-semibold">Mix-ups seen: </span>
                        {g.misconceptions
                          .slice(0, 3)
                          .map((m) => `${m.label} (${m.count})`)
                          .join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted">Found while checking: {g.topics.join(", ")}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="font-display text-2xl font-semibold">
              Every check-up
            </h2>
            <div tabIndex={0} role="region" aria-label="Every check-up (scrolls sideways)" className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">Every check-up in this class, newest first</caption>
                <thead className="border-b border-line bg-surface-2 text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Chapter</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Root gap</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Mix-up</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{day(r.createdAt)}</td>
                      <td className="px-4 py-3">{r.topicTitle}</td>
                      <td className="px-4 py-3 font-semibold">{r.noGap ? <span className="text-ok">✓ No gap</span> : (r.rootTitle ?? "–")}</td>
                      <td className="px-4 py-3">{r.misconception ?? "–"}</td>
                      <td className="px-4 py-3">{r.confidence ? CONFIDENCE[r.confidence] : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section aria-labelledby="privacy-heading" className="rounded-2xl bg-surface-2 p-5 text-sm leading-relaxed">
        <h2 id="privacy-heading" className="font-semibold">
          What you can see
        </h2>
        <p className="mt-1">
          Only the outcome of each check-up: chapter, class, root gap, mix-up and confidence. Never a student&apos;s name, answers or device. Results are deleted automatically after {RETENTION_DAYS} days.
        </p>
        <div className="mt-3">
          {confirmDelete ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Delete this class and all its results? This can&apos;t be undone.</span>
              <button
                type="button"
                onClick={async () => {
                  const reply = await removeClass(view.code);
                  if (!reply.ok) return setError(reply.error);
                  setDeleted(true);
                }}
                className="rounded-lg bg-gap px-3 py-1.5 font-semibold text-surface"
              >
                Yes, delete it
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-line bg-surface px-3 py-1.5 font-semibold">
                Keep it
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="font-semibold text-gap underline underline-offset-4">
              Delete this class
            </button>
          )}
          {error && view && (
            <p role="alert" className="mt-2 text-gap">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
