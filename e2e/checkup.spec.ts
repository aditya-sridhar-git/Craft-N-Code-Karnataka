import { expect, test } from "@playwright/test";
import { answerAsStudentWithGap, expectNoSeriousA11yIssues } from "./helpers";

test("a student stuck on projectile motion is traced to trig ratios", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: /Projectile motion/ }).click();
  await expect(page).toHaveURL(/\/check/);
  await expect(page.getByText("First, a quick look at Projectile motion itself.")).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  await answerAsStudentWithGap(page, "trig-ratios");

  await expect(page).toHaveURL(/\/report\?id=/);
  const finding = page.locator("#finding");
  await expect(finding).toHaveText("Trigonometric ratios");
  await expect(page.getByText("Class 10 · Introduction to trigonometry")).toBeVisible();
  await expect(page.getByRole("img", { name: /Skill tree for Projectile motion/ })).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  // Repair: with no AI key the lesson falls back to Taproot's curated one.
  await page.getByRole("link", { name: "Fix this root now" }).click();
  await expect(page).toHaveURL(/\/repair/);
  await expect(page.getByRole("heading", { level: 2, name: /Trigonometric ratios|trig/i })).toBeVisible();
  await page.getByRole("button", { name: "Show me an example" }).click();
  await expect(page.getByText("Step 2 · A worked example")).toBeVisible();
  await page.getByRole("button", { name: "I'm ready to practise" }).click();
  await expect(page.getByText(/question 1 of 3/i)).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  // The report is listed in history.
  await page.goto("/history");
  await expect(page.getByText("Root gap: Trigonometric ratios")).toBeVisible();
});

test("a student with no gap is told so after the first check", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: /Quadratic equations/ }).click();
  await answerAsStudentWithGap(page, null);
  await expect(page.locator("#finding")).toHaveText("No gap found");
});

test("keyboard: 1–4 answer and N means not sure", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcuts are a desktop feature");
  await page.goto("/start");
  await page.getByRole("button", { name: /Mole concept/ }).click();
  await expect(page.getByText("Question 1")).toBeVisible();
  await page.keyboard.press("n");
  await expect(page.getByText("Question 2")).toBeVisible();
  await page.keyboard.press("2");
  await expect(page.getByText("Question 3")).toBeVisible();
});

for (const path of ["/", "/start", "/about", "/history"]) {
  test(`no serious accessibility issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoSeriousA11yIssues(page);
  });
}

test("dark mode and large text from the reading menu", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Reading and display settings" }).click();
  await page.getByText("Dark", { exact: true }).click();
  await page.getByText("Extra large", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-text", "xl");
  await page.keyboard.press("Escape");
  await expectNoSeriousA11yIssues(page);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
