import type { Metadata } from "next";
import { CheckRunner } from "@/frontend/features/check/CheckRunner";

export const metadata: Metadata = { title: "Check-up" };

export default function CheckPage() {
  return <CheckRunner />;
}
