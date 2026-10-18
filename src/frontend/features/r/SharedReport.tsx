"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ReportView } from "@/frontend/components/ReportView";
import { decodeReport } from "@/frontend/lib/share";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function SharedReport() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => null);
  const report = useMemo(() => (hash ? decodeReport(hash) : null), [hash]);

  if (hash === null) return <p className="text-muted">Opening the shared report…</p>;
  if (!report) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold">This link doesn&apos;t contain a report</h1>
        <p className="mt-2 text-muted">It may have been cut short when it was copied. Ask for the link again.</p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <p className="no-print rounded-xl bg-surface-2 p-4 text-sm">
        A student shared this Taproot check-up with you. It shows where their trouble starts, not a mark. Their individual answers aren&apos;t included.{" "}
        <Link href="/about" className="font-semibold underline underline-offset-2">
          How Taproot works
        </Link>
      </p>
      <ReportView shared title={report.title} subject={report.subject} grade={report.grade} createdAt={report.createdAt} graph={report.graph} result={report.result} />
    </div>
  );
}
