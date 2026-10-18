"use client";

import Link from "next/link";
import { useState } from "react";

/** A one-question taste of Taproot on the home page: every wrong option names the mix-up behind it. */
const OPTIONS = [
  { text: "3/5", right: true, says: "Right: sine is opposite over hypotenuse. In a real check-up Taproot would now mark trig ratios as solid and look elsewhere." },
  { text: "4/5", right: false, says: "That's cos θ, adjacent over hypotenuse. Taproot reads this as swapping sine and cosine, the most common trig mix-up." },
  { text: "5/3", right: false, says: "That's the ratio upside down, hypotenuse over opposite. Taproot reads this as flipping the ratio." },
  { text: "3/4", right: false, says: "That's tan θ, opposite over adjacent. Taproot reads this as mixing up which side goes on the bottom." },
];

export function TryOne() {
  const [chosen, setChosen] = useState<number | null>(null);
  const pick = chosen === null ? null : OPTIONS[chosen];

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold tracking-wide text-soil uppercase">Try one question</p>
      <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <svg viewBox="0 0 180 130" className="mx-auto w-44" role="img" aria-label="A right triangle: the side opposite angle theta is 3, the side next to it is 4, and the hypotenuse is 5.">
          <path d="M20 110 H150 V20 Z" fill="var(--leaf-soft)" stroke="var(--leaf)" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M138 110 V98 H150" fill="none" stroke="var(--leaf)" strokeWidth="1.8" />
          <path d="M44 110 A24 24 0 0 0 40 96" fill="none" stroke="var(--soil)" strokeWidth="2" />
          <text x="52" y="104" fontSize="13" fontWeight="700" fill="var(--soil)">θ</text>
          <text x="85" y="126" fontSize="13" fill="var(--ink)" textAnchor="middle">4</text>
          <text x="162" y="70" fontSize="13" fill="var(--ink)">3</text>
          <text x="74" y="56" fontSize="13" fill="var(--ink)">5</text>
        </svg>
        <div>
          <h3 id="try-q" className="text-lg font-semibold sm:text-xl">
            In this triangle, what is sin θ?
          </h3>
          <div role="group" aria-labelledby="try-q" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {OPTIONS.map((o, i) => {
              const on = chosen === i;
              return (
                <button
                  key={o.text}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChosen(i)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={[
                    "option-in min-h-12 rounded-xl border px-4 py-2.5 text-lg font-semibold transition-all active:scale-95",
                    on && o.right ? "border-ok bg-ok-soft" : on ? "border-gap bg-gap-soft" : "border-line bg-paper hover:-translate-y-0.5 hover:border-leaf hover:bg-leaf-soft",
                  ].join(" ")}
                >
                  {on ? (o.right ? "✓ " : "✕ ") : ""}
                  {o.text}
                </button>
              );
            })}
          </div>
          <div aria-live="polite">
            {pick && (
              <div key={chosen} className={`rise mt-4 rounded-xl p-4 ${pick.right ? "bg-ok-soft" : "bg-sun-soft"}`}>
                <p className="leading-relaxed">{pick.says}</p>
                <p className="mt-2 text-sm text-muted">Every wrong option in Taproot points to a named mix-up like this, so it can tell you why, not just where.</p>
                <Link href="/start" className="mt-3 inline-block rounded-xl bg-leaf px-4 py-2 font-semibold text-leaf-ink active:scale-95">
                  Run a full check-up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
