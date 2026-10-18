import type { Metadata } from "next";
import { Suspense } from "react";
import { RepairFlow } from "@/frontend/features/repair/RepairFlow";

export const metadata: Metadata = { title: "Repair and climb" };

export default function RepairPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <RepairFlow />
    </Suspense>
  );
}
