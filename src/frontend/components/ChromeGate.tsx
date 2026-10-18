"use client";

import { usePathname } from "next/navigation";

/** Hides the site header and footer on the dedicated login pages. */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith("/login") ? null : children;
}
