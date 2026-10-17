"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportView } from "@/components/ReportView";
import { reportsStore } from "@/lib/session";
import { useStore } from "@/lib/store";

export function ReportLoader() {
  const id = useSearchParams().get("id");
  const reports = useStore(reportsStore);
  if (reports === undefined) return <p className="text-muted">Loading your report…</p>;
  const report = reports?.find((r) => r.id === id);
  if (!report) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold">Report not found</h1>
        <p className="mt-2 text-muted">Reports are saved only in the browser where you did the check-up. It may have been deleted, or opened on another device.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/history" className="rounded-xl border border-line px-4 py-2 font-semibold">
            My checks
          </Link>
          <Link href="/start" className="rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink">
            Start a check-up
          </Link>
        </div>
      </div>
    );
  }
  return (
    <ReportView
      reportId={report.id}
      title={report.title}
      subject={report.subject}
      grade={report.grade}
      createdAt={report.createdAt}
      graph={report.graph}
      result={report.result}
      asked={report.asked}
      plan={report.plan}
      problemText={report.source.kind === "problem" ? report.source.text : null}
    />
  );
}
