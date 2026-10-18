import type { Metadata } from "next";
import { StartForm } from "@/frontend/features/start/StartForm";

export const metadata: Metadata = { title: "Start a check-up" };

export default function StartPage() {
  return (
    <div>
      <p className="text-sm font-semibold tracking-wide text-soil uppercase">Start a check-up</p>
      <h1 className="mt-1 max-w-2xl font-display text-4xl font-semibold tracking-tight">What are you stuck on?</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        You&apos;ll answer about 10–16 quick questions. Taproot uses them to trace the trouble down to the earlier skill where it starts. It takes about five minutes.
      </p>
      <div className="mt-8">
        <StartForm />
      </div>
    </div>
  );
}
