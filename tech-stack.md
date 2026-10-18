# Taproot: video notes and tech stack

Live app: https://craft-n-code-karnataka.vercel.app

---

## 1. The project in 30 seconds

**Taproot is a five-minute check-up that finds the real reason a student is stuck in maths or science.**

Maths and science are built in layers. When a student can't do projectile motion, the cause is often an older skill such as trigonometric ratios. School tests only say "weak in this chapter", never *why*. Taproot traces the chapter down its tree of earlier skills, finds the **root gap** and the **mix-up** behind it (for example "swapping sine and cosine"), then gives a short repair and helps the student climb back up. Teachers get a class dashboard showing which earlier skill most of the class is missing.

- **User:** Class 8–12 students in Karnataka (State Board, PUC, CBSE), and their teachers.
- **Evidence the problem is real:** national maths scores fall from 57% in Class 3 to 32% in Class 10 (National Achievement Survey 2021). Teaching at each student's real level raised maths scores by 0.37 SD in 4.5 months (Muralidharan et al., 2019).

---

## 2. Video script (about 5 minutes)

**0:00 – Intro (30 s).** Say the 30-second summary above. Show the home page, tap a skill in the animated tree.

**0:30 – Teacher signs in and makes a class (45 s).**
1. Click **Log in** (top right) → choose **Teacher** → **Create a teacher account** (name, email, password).
2. On *Your classes*, type a class name such as "10 B Maths" → **Make class**.
3. The dashboard shows the **6-character class code**. Say: "Teachers share this code. Students never need an account."

**1:15 – Student joins and takes the check-up (1 min 30 s).** Use a second browser or an incognito window.
1. **Log in** → **Student** → enter the class code and an optional nickname → **Join class**.
2. Pick **Projectile motion**.
3. Point out: each question says *why* it is being asked; there is an **I'm not sure** button; answers stay hidden because it's a check-up, not a test.
4. Answer the trig-ratio questions wrongly or with "I'm not sure", the rest correctly.

**2:45 – The report (45 s).** Show the root gap (Trigonometric ratios, Class 10), the tree with the path up to projectile motion, the mix-up detected, the evidence and the confidence level. Mention: the report stays on the device; it can be printed or shared as a link.

**3:30 – Repair and climb (30 s).** Click **Fix this root now**: a lesson aimed at the student's own mix-up, a worked example, three practice questions, then the climb back up.

**4:00 – Back to the teacher (30 s).** Press **Refresh** on the dashboard: the check-up appears under *What to re-teach*, ranked by root gap, with the mix-ups. Say: "No names or answers are stored, only the outcome, and results are deleted after 90 days."

**4:30 – Evidence and close (30 s).** Tested on 10,000 simulated students: the first answer is the true root gap 85% of the time, in about 14 questions; a normal chapter test finds it under 5% of the time. Next step: a classroom pilot in Karnataka.

---

## 3. Tech stack, and where each piece is used

| Technology | What it does in Taproot | Where in the code |
|---|---|---|
| **Next.js 16** (App Router) | The whole web app: pages and the backend API in one project | `src/app/` (pages, and API routes in `src/app/api/`) |
| **React 19** | Every screen: check-up, report, repair, login, dashboard | `src/frontend/features/`, `src/frontend/components/` |
| **TypeScript** | All code, front and back, with shared types | everywhere; shared types in `src/shared/types.ts` |
| **Tailwind CSS 4** | Styling, the green theme, dark mode, animations | `src/app/globals.css` and class names in components |
| **KaTeX** | Renders maths in questions and lessons, with MathML so screen readers can read it | `src/frontend/components/MathText.tsx` |
| **dagre** | Lays out the skill tree diagram on the report | `src/frontend/components/RootTree.tsx` |
| **zod** | Checks every API request and every AI reply against a schema | `src/shared/classes.ts`, `src/backend/ai/schemas.ts` |
| **Groq API** (groq-sdk) | Runs the AI models (free tier) | `src/backend/lib/llm.ts` |
| **gpt-oss-120b** (open model on Groq) | Builds skill trees for any topic, writes questions, writes lessons | `src/backend/ai/pipeline.ts` |
| **qwen3.8-27b** (open model on Groq) | Solves AI-written questions *blind* to cross-check them | `src/backend/ai/pipeline.ts` |
| **Postgres on Neon** | Teacher accounts, sign-in sessions, classes and class results | `src/backend/db/store.ts` |
| **Node crypto (scrypt)** | Hashes teacher passwords; random session tokens | `src/backend/lib/auth.ts` |
| **Browser localStorage** | Keeps each student's reports on their own device (no server) | `src/frontend/lib/store.ts`, `session.ts` |
| **Vercel** | Hosting: pages plus the API as serverless functions | `vercel.json` |
| **Vitest** | 106 unit tests (engine, question templates, APIs) | `tests/` |
| **Playwright + axe** | 27 browser tests on desktop and mobile, with accessibility scans | `e2e/` |

The code is in three layers: `src/frontend` (what runs in the browser), `src/backend` (server code: AI, database, accounts) and `src/shared` (the skill graph, questions and diagnosis engine that both sides use).

---

## 4. How the questions are generated

There are three sources, used in this order.

**a) Question templates (the main source, for the five featured chapters).**
- 115 small programs, one per kind of question, in `src/shared/questions/generators/` (algebra, number, geometry, physics, chemistry).
- Each time, a template picks **fresh random numbers** and **computes the exact answer in code**, so the right answer is always correct, never guessed by AI.
- **Every wrong option is a real mistake.** Each one is the answer a named misconception produces, for example adding fractions top-and-bottom, or multiplying by 3.6 to turn km/h into m/s. There are 103 named misconceptions. So when a student picks a wrong option, Taproot knows *why* they went wrong.

**b) A hand-written bank** of 34 conceptual questions (for example "what is the acceleration at the top of a throw?") in `src/shared/data/bank.ts`.

**c) AI-written questions, only for skills that have no curated questions** (custom topics the student types in).
1. `gpt-oss-120b` writes questions, tagging each wrong option with the misconception behind it.
2. A **different model family**, `qwen3.8-27b`, solves them **without seeing the answer key**.
3. Only questions where both models agree are shown, and they are labelled as AI-written.
4. In testing against the live API, the checker caught **100%** of deliberately wrong answer keys.

For a typed topic or a pasted problem, the AI first builds a small skill tree and links it to Taproot's checked foundation skills. Code then cleans it: it drops unknown links, breaks loops and caps its size.

---

## 5. How the student is assessed

The assessment is **not AI**. It is a transparent algorithm in `src/shared/engine/diagnose.ts`.

1. **A tree of skills.** Each chapter sits on a hand-built tree of prerequisite skills (34 skills from Class 6 to Class 11). Projectile motion rests on vector components and equations of motion, which rest on trigonometric ratios, and so on.

2. **Each skill is decided by weighing evidence** (a *sequential probability ratio test*, Wald 1945).
   - A right answer is about **6 times** likelier from a student who knows the skill than from one guessing.
   - "I'm not sure" is strong evidence they don't know it.
   - Taproot keeps asking about a skill until the odds pass about **20 to 1** either way, which takes **2 to 4 questions**.

3. **A binary search down the tree.** Taproot looks underneath the deepest failure that isn't explained yet, and asks about the skill that best splits the remaining suspects. Passing a skill marks everything under it as solid without asking. Failing a skill marks everything built on it as affected.

4. **The root gap** is a skill the student failed while its own foundations are solid. Once every failure is explained, Taproot quickly checks the remaining branches so a second gap isn't missed.

5. **The result** names the root gap, the misconception (from which wrong options were chosen), the evidence and a confidence level. The whole check-up is about 14 questions, at most 20.

**Does it work?** On 10,000 simulated students with hidden gaps, careless slips and lucky guesses:

| Method | First answer is the true root gap | Questions |
|---|---|---|
| **Taproot** | **85.4%** | **13.8** |
| Testing every skill | 91.4% (but 17.7% false alarms) | 35.5 |
| Walking down one level at a time | 74.9% | 14.2 |
| A normal chapter test | 4.7% | 5.0 |

---

## 6. Privacy and accessibility (one line each)

- Students never create accounts; the class code is all they need.
- A class receives only the outcome (chapter, root gap, mix-up, confidence), never names or answers, and it is deleted after 90 days.
- Reports stay in the student's browser; share links carry no answers.
- Full keyboard use (1–4 to answer, N for not sure), screen-reader maths, larger text, dark mode, WCAG AA contrast.
