import Link from "next/link";
import { HeroTree } from "@/components/HeroTree";
import { pct, SIM, studentsTotal } from "@/lib/evidence";

const steps = [
  {
    n: "1",
    title: "Tell Taproot where you're stuck",
    body: "Pick a chapter, type any maths or science topic, or paste the exact problem you can't solve.",
  },
  {
    n: "2",
    title: "Answer about 12 quick questions",
    body: "Taproot walks down the skills your topic is built on, like a doctor running tests. It skips what it can work out from your answers, and tells you why it's asking each one.",
  },
  {
    n: "3",
    title: "Fix the root, then climb back up",
    body: "See the earlier skill where the trouble starts and the mix-up behind it. A 10-minute lesson and practice fix it, then you climb skill by skill back to your chapter.",
  },
];

export default function Home() {
  const split = SIM.overall.split;
  const chapter = SIM.overall["chapter-test"];
  const everything = SIM.overall.exhaustive;
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-semibold tracking-wide text-soil uppercase">A five-minute check-up for maths & science</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Stuck on a chapter? The real problem might be <span className="text-gap">three chapters back.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Taproot traces the topic you&apos;re stuck on down its roots, the earlier skills it&apos;s built on, and shows you exactly where the trouble starts. Then it helps you fix that skill and climb back up.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/start" className="rounded-xl bg-leaf px-6 py-3.5 text-lg font-semibold text-leaf-ink shadow-sm hover:opacity-95">
              Find my root gap
            </Link>
            <a href="#how" className="rounded-xl px-4 py-3.5 font-semibold text-ink underline-offset-4 hover:underline">
              How it works
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">Free · No sign-up · Results stay on your device</p>
        </div>
        <figure className="rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-6">
          <HeroTree />
          <figcaption className="mt-3 text-sm text-muted">
            A student stuck on projectile motion. The trouble isn&apos;t projectiles at all: it traces back to trigonometric ratios, from Class 10.
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="why-heading">
        <h2 id="why-heading" className="font-display text-3xl font-semibold tracking-tight">
          Why re-reading the chapter doesn&apos;t help
        </h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">
          Maths and science are built in layers. When a student is stuck, the missing piece is often an earlier skill, and school tests only say <em>that</em> you&apos;re weak in this chapter, never <em>why</em>.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-display text-4xl font-semibold text-gap">57% → 32%</p>
            <p className="mt-2">Average maths score falls from Class 3 to Class 10 as gaps pile up.</p>
            <p className="mt-2 text-sm text-muted">National Achievement Survey 2021, Ministry of Education</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-display text-4xl font-semibold text-soil">Years behind</p>
            <p className="mt-2">Middle-school students in Delhi were several grade levels behind in maths, and the gap grew every year.</p>
            <p className="mt-2 text-sm text-muted">Muralidharan, Singh &amp; Ganimian, American Economic Review, 2019</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-display text-4xl font-semibold text-leaf">+0.37 SD</p>
            <p className="mt-2">Maths gain in 4.5 months when teaching matched each student&apos;s actual level, not their class.</p>
            <p className="mt-2 text-sm text-muted">Same study (the Mindspark trial)</p>
          </div>
        </div>
      </section>

      <section id="how" aria-labelledby="how-heading" className="scroll-mt-24">
        <h2 id="how-heading" className="font-display text-3xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-line bg-surface p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sun-soft font-display text-lg font-semibold text-sun-ink">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="proof-heading" className="rounded-3xl bg-leaf-soft p-6 sm:p-10">
        <h2 id="proof-heading" className="font-display text-3xl font-semibold tracking-tight">
          Does it find the right root?
        </h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed">
          We tested the diagnosis on {studentsTotal().toLocaleString("en-IN")} simulated students with known gaps, including careless slips, lucky guesses and &quot;not sure&quot; answers.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">Taproot&apos;s first answer was the true root gap</dt>
            <dd className="mt-1 font-display text-4xl font-semibold text-leaf">{pct(split.firstRootReal)}</dd>
            <dd className="mt-1 text-sm text-muted">using {split.avgQuestions.toFixed(0)} questions on average</dd>
          </div>
          <div className="rounded-2xl bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">A normal chapter test found it</dt>
            <dd className="mt-1 font-display text-4xl font-semibold text-gap">{pct(chapter.firstRootReal)}</dd>
            <dd className="mt-1 text-sm text-muted">it can only say &quot;weak in this chapter&quot;</dd>
          </div>
          <div className="rounded-2xl bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">Testing every skill instead</dt>
            <dd className="mt-1 font-display text-4xl font-semibold text-soil">{everything.avgQuestions.toFixed(0)} questions</dd>
            <dd className="mt-1 text-sm text-muted">and false alarms for {pct(everything.falseAlarm)} of students with no gap</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm">
          <Link href="/about#evidence" className="font-semibold underline underline-offset-4">
            How we tested it, and what simulation can&apos;t tell us
          </Link>
        </p>
      </section>

      <section aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="font-display text-3xl font-semibold tracking-tight">
          Built to be trusted
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["It explains itself", "Every question comes with a reason, and every result with its evidence and a confidence level."],
            ["Checked questions", "Featured chapters use hand-checked skill trees and questions whose answers are computed, not guessed. Questions written by AI are kept only if a second, independent AI model gets the same answer."],
            ["Private by default", "No accounts and no tracking. Your results are stored only in your browser, and you can delete them any time."],
            ["Works for everyone", "Big tap targets, full keyboard use, screen-reader friendly maths, larger text, easy-read spacing and a dark mode. Featured chapters work even without the AI service."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{b}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="teachers-heading" className="grid gap-6 rounded-3xl border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <h2 id="teachers-heading" className="font-display text-3xl font-semibold tracking-tight">
            For teachers and tutors
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            A student can send you a link to their report: which earlier skill to re-teach and which mix-up to address, not just a mark. No accounts needed on either side.
          </p>
        </div>
        <Link href="/start" className="justify-self-start rounded-xl bg-leaf px-6 py-3.5 text-lg font-semibold text-leaf-ink md:justify-self-end">
          Try a check-up
        </Link>
      </section>
    </div>
  );
}
