import type { Metadata } from "next";
import { CheckRunner } from "./CheckRunner";

export const metadata: Metadata = { title: "Check-up" };

export default function CheckPage() {
  return <CheckRunner />;
}
