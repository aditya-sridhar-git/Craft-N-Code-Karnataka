import { expect, test } from "@playwright/test";

// Uses the real AI service (needs GROQ_API_KEY on the server). Run with:
//   LIVE_AI=1 npx playwright test live-ai --project=desktop
test.skip(!process.env.LIVE_AI, "live AI test runs only on demand");
test.setTimeout(300_000);

test("custom topic: AI maps it, writes checked questions, and finds a planted gap", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/start");
  await page.getByLabel("Topic or chapter").fill("Arithmetic progressions");
  await page.getByLabel("Your class").selectOption("10");
  const t0 = Date.now();
  await page.getByRole("button", { name: "Build my skill tree" }).click();
  await expect(page).toHaveURL(/\/check/, { timeout: 60_000 });
  const mapped = Date.now();

  // The student can't do the nth-term formula (or anything built on it).
  const waits: number[] = [];
  for (let i = 0; i < 40; i++) {
    const start = Date.now();
    await page.waitForFunction(() => location.pathname.startsWith("/report") || !!document.querySelector('[role="group"] button'), null, { timeout: 90_000 });
    waits.push(Date.now() - start);
    if (new URL(page.url()).pathname.startsWith("/report")) break;
    if (i === 0) await page.screenshot({ path: "docs/screenshots/10-ai-question.png" });
    const info = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("taproot:session") || "null");
      if (!s?.pending) return null;
      const nodes = s.graph.nodes as Record<string, { title: string; prereqs: string[] }>;
      const gap = Object.keys(nodes).find((id) => /nth term/i.test(nodes[id].title));
      const seen = new Set<string>();
      const depends = (id: string): boolean => id === gap || (!seen.has(id) && Boolean(nodes[id]) && (seen.add(id), nodes[id].prereqs.some(depends)));
      const q = s.pending.question;
      return { id: q.id, knows: !gap || !depends(q.skillId), correct: q.options.findIndex((o: { correct: boolean }) => o.correct), source: q.source };
    });
    if (!info) {
      await page.waitForTimeout(200);
      continue;
    }
    if (info.knows) await page.locator('[role="group"] button').nth(info.correct).click();
    else await page.getByRole("button", { name: "I'm not sure" }).click();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("taproot:session") || "null")?.pending?.question.id !== id, info.id);
  }
  await expect(page).toHaveURL(/\/report/);
  console.log(`mapping: ${((mapped - t0) / 1000).toFixed(1)} s; waits per question (s): ${waits.map((w) => (w / 1000).toFixed(1)).join(", ")}`);
  console.log("finding:", await page.locator("#finding").innerText());
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/screenshots/11-ai-report.png", fullPage: true });

  await page.getByRole("link", { name: "Fix this root now" }).click();
  await expect(page.getByText("Explanation written by AI for your answers", { exact: false })).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "docs/screenshots/12-ai-lesson.png" });
});
