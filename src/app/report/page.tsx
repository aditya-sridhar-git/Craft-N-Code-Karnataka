import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportLoader } from "./ReportLoader";

export const metadata: Metadata = { title: "Your report" };

export default function ReportPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your report…</p>}>
      <ReportLoader />
    </Suspense>
  );
}
