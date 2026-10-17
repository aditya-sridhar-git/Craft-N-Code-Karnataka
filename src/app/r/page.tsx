import type { Metadata } from "next";
import { SharedReport } from "./SharedReport";

export const metadata: Metadata = { title: "Shared report", robots: { index: false } };

export default function SharedReportPage() {
  return <SharedReport />;
}
