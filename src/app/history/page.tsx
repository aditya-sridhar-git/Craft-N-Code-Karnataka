import type { Metadata } from "next";
import { HistoryList } from "./HistoryList";

export const metadata: Metadata = { title: "My checks" };

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold tracking-wide text-soil uppercase">My checks</p>
      <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Your check-ups</h1>
      <p className="mt-2 mb-8 text-muted">Come back a few days after fixing a root for a quick re-check: spacing out practice helps it stick.</p>
      <HistoryList />
    </div>
  );
}
