import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * Plays a student who lacks `gap` (and therefore everything built on it): answers correctly
 * when they know the skill and says "I'm not sure" otherwise. The correct option is read from
 * the session the page itself saved, so the app needs no test-only hooks.
 */
export async function answerAsStudentWithGap(page: Page, gap: string | null) {
  for (let i = 0; i < 60; i++) {
    await page.waitForFunction(() => location.pathname.startsWith("/report") || !!document.querySelector('[role="group"] button'), null, {
      timeout: 20_000,
    });
    if (new URL(page.url()).pathname.startsWith("/report")) return;
    const info = await page.evaluate((gapId) => {
      const s = JSON.parse(localStorage.getItem("taproot:session") || "null");
      if (!s?.pending) return null;
      const nodes = s.graph.nodes as Record<string, { prereqs: string[] }>;
      const seen = new Set<string>();
      const dependsOnGap = (id: string): boolean => {
        if (id === gapId) return true;
        if (seen.has(id) || !nodes[id]) return false;
        seen.add(id);
        return nodes[id].prereqs.some(dependsOnGap);
      };
      const q = s.pending.question;
      return { id: q.id as string, knows: gapId === null || !dependsOnGap(q.skillId), correct: q.options.findIndex((o: { correct: boolean }) => o.correct) as number };
    }, gap);
    if (!info) {
      await page.waitForTimeout(100);
      continue;
    }
    if (info.knows) await page.locator('[role="group"] button').nth(info.correct).click();
    else await page.getByRole("button", { name: "I'm not sure" }).click();
    await page.waitForFunction((id) => {
      const s = JSON.parse(localStorage.getItem("taproot:session") || "null");
      return !s || s.pending?.question.id !== id;
    }, info.id);
  }
  throw new Error("The check-up didn't finish within 60 questions");
}

export async function expectNoSeriousA11yIssues(page: Page) {
  // Let entrance animations finish: mid-fade opacity would distort the contrast check.
  // Scroll-linked animations (they follow the scroll position, not time) never "finish", so skip them.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => !(a.timeline instanceof DocumentTimeline) || a.playState !== "running"),
  );
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => ({ id: v.id, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }))).toEqual([]);
}
