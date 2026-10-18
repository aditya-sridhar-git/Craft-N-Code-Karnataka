import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassDashboard } from "@/frontend/features/teacher/ClassDashboard";

export const metadata: Metadata = { title: "Class dashboard", robots: { index: false } };

export default function ClassDashboardPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your class…</p>}>
      <ClassDashboard />
    </Suspense>
  );
}
