"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteReport, reportsStore, sessionStore } from "@/lib/session";
import { clearAll } from "@/lib/storage";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/words";

const DAY = 24 * 60 * 60 * 1000;

export function HistoryList() {
  const reports = useStore(reportsStore);
  const session = useStore(sessionStore);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  if (reports === undefined) return <p className="text-muted">Loading…</p>;
  const list = [...(reports ?? [])].sort((a, b) => b.createdAt - a.createdAt);
  // Read the clock in render only for display; a stale value by a few seconds doesn't matter here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="space-y-8">
      {session && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sun bg-sun-soft p-5 sm:flex-row sm:items-center">
          <p className="flex-1">
            Unfinished check-up: <strong>{session.title}</strong> ({session.asked.length} answered).
          </p>
          <Link href="/check" className="rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
            Continue
          </Link>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">{cleared ? "All your Taproot data has been deleted." : "No check-ups yet."}</p>
          <p className="mt-1 text-muted">When you finish a check-up, its report is saved here, on this device only.</p>
          <Link href="/start" className="mt-4 inline-block rounded-xl bg-leaf px-5 py-3 font-semibold text-leaf-ink">
            Start a check-up
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const root = r.result.roots[0];
            const rootTitle = root ? r.graph.nodes[root.skillId]?.title : null;
            const repaired = Boolean(r.repair.finishedAt);
            const due = root && now - r.createdAt > 3 * DAY;
            return (
              <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-display text-xl font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatDate(r.createdAt)} · {r.result.questionsAsked} questions
                  </p>
                  <p className="mt-2">
                    {rootTitle ? (
                      <>
                        Root gap: <strong>{rootTitle}</strong>
                      </>
                    ) : r.result.targetMastered ? (
                      "No gap found"
                    ) : (
                      "No root gap confirmed"
                    )}
                    {repaired && <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 text-sm font-semibold text-ok">✓ Repaired</span>}
                    {!repaired && r.repair.completed.length > 0 && <span className="ml-2 rounded-full bg-sun-soft px-2 py-0.5 text-sm font-semibold text-sun-ink">Repair started</span>}
                    {due && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-sm">Time for a re-check</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/report?id=${r.id}`} className="rounded-xl border border-line px-4 py-2 font-semibold hover:bg-surface-2">
                    Open
                  </Link>
                  {root && !repaired && (
                    <Link href={`/repair?id=${r.id}&skill=${root.skillId}`} className="rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
                      Repair
                    </Link>
                  )}
                  <button type="button" onClick={() => deleteReport(r.id)} className="rounded-xl px-3 py-2 text-muted hover:bg-gap-soft hover:text-ink" aria-label={`Delete the report on ${r.title}`}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-labelledby="data-heading" className="rounded-2xl border border-line bg-surface p-5">
        <h2 id="data-heading" className="font-semibold">
          Your data
        </h2>
        <p className="mt-1 text-sm text-muted">
          Reports, unfinished check-ups and display settings are stored only in this browser. Nothing is kept on a server.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true);
            clearAll();
            reportsStore.set(null);
            sessionStore.set(null);
            setConfirmClear(false);
            setCleared(true);
          }}
          onBlur={() => setConfirmClear(false)}
          className="mt-3 rounded-xl border border-gap px-4 py-2 text-sm font-semibold text-gap hover:bg-gap-soft"
        >
          {confirmClear ? "Sure? This can't be undone" : "Delete all my Taproot data"}
        </button>
      </section>
    </div>
  );
}
