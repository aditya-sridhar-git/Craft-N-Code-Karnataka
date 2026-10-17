import Link from "next/link";
import { SITE } from "@/lib/site";
import { A11yMenu } from "./A11yMenu";
import { Logo } from "./Logo";

const navLink = "rounded-lg px-2.5 py-2 text-ink/80 hover:bg-surface-2 hover:text-ink";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <Link href="/" className="mr-auto flex items-center gap-2 rounded-lg font-display text-xl font-semibold tracking-tight text-ink">
          <Logo className="h-8 w-8" />
          Taproot
        </Link>
        <nav aria-label="Main" className="flex items-center gap-0.5 text-sm">
          <Link href="/start" className={navLink}>
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start a check</span>
          </Link>
          <Link href="/history" className={navLink}>
            <span className="sm:hidden">Mine</span>
            <span className="hidden sm:inline">My checks</span>
          </Link>
          <Link href="/about" className={navLink}>
            <span className="sm:hidden">About</span>
            <span className="hidden sm:inline">How it works</span>
          </Link>
          <A11yMenu />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl">
          Taproot is a free learning check-up, not an exam. No sign-up. Your results stay on this device unless you choose to share them.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/about#privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/about#limits" className="underline-offset-4 hover:underline">
            Limits
          </Link>
          <a href={SITE.repo} className="underline-offset-4 hover:underline">
            Source code
          </a>
        </div>
      </div>
    </footer>
  );
}
