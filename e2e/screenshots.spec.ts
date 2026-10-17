import { expect, test } from "@playwright/test";
import { answerAsStudentWithGap } from "./helpers";

// Regenerates docs/screenshots. Run with: SHOTS=1 npx playwright test screenshots --project=desktop
test.skip(!process.env.SHOTS, "screenshots are only taken on demand");

const shot = (name: string) => `docs/screenshots/${name}.png`;

test("screenshots of the main flow", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/");
  await page.screenshot({ path: shot("01-home") });

  await page.goto("/start");
  await page.screenshot({ path: shot("02-start") });

  await page.getByRole("button", { name: /Projectile motion/ }).click();
  await expect(page.getByText("Question 1")).toBeVisible();
  // Answer a few questions as a student with a trig-ratios gap, then capture a mid-check question.
  for (let i = 0; i < 4; i++) {
    const info = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("taproot:session") || "null");
      return s?.pending ? { id: s.pending.question.id, skill: s.pending.question.skillId, correct: s.pending.question.options.findIndex((o: { correct: boolean }) => o.correct) } : null;
    });
    if (!info) break;
    const knows = !["projectile", "components", "trig-ratios", "standard-angles"].includes(info.skill);
    if (knows) await page.locator('[role="group"] button').nth(info.correct).click();
    else await page.getByRole("button", { name: "I'm not sure" }).click();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("taproot:session") || "null")?.pending?.question.id !== id, info.id);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot("03-check") });

  await answerAsStudentWithGap(page, "trig-ratios");
  await expect(page.locator("#finding")).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot("04-report"), fullPage: false });
  await page.evaluate(() => {
    document.getElementById("tree-heading")?.scrollIntoView({ block: "start" });
    window.scrollBy(0, -80);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot("05-tree") });
  await page.screenshot({ path: shot("06-report-full"), fullPage: true });

  await page.getByRole("link", { name: "Fix this root now" }).click();
  await expect(page.getByRole("button", { name: "Show me an example" })).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot("07-repair") });

  await page.goto("/about#evidence");
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot("08-evidence") });

  // Mobile and dark mode.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/history");
  await page.getByRole("link", { name: "Open" }).first().click();
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot("09-mobile-dark-report") });
});
