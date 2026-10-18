import { expect, test } from "@playwright/test";
import { answerAsStudentWithGap, expectNoSeriousA11yIssues } from "./helpers";

test("a teacher signs up and makes a class; a student joins with the code and their check-up appears", async ({ browser }) => {
  // Teacher and student are separate browsers: nothing is shared through cookies or local storage.
  const teacher = await (await browser.newContext()).newPage();
  await teacher.goto("/");
  await teacher.getByRole("link", { name: "Log in" }).click();
  await expect(teacher).toHaveURL(/\/login$/);
  await expect(teacher.getByRole("link", { name: "Taproot home" })).toBeVisible();
  await expect(teacher.getByRole("banner")).toHaveCount(0); // a dedicated page, without the site header
  await teacher.getByRole("button", { name: /^Teacher/ }).click();
  await expect(teacher).toHaveURL(/\/login\/teacher/);
  await teacher.getByRole("button", { name: "Create a teacher account" }).click();
  await teacher.getByLabel("Your name").fill("Asha Rao");
  const email = `asha-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@school.test`;
  await teacher.getByLabel("Email").fill(email);
  await teacher.getByLabel("Password").fill("correct horse");
  await expectNoSeriousA11yIssues(teacher);
  await teacher.locator("form").getByRole("button", { name: "Create account" }).click();

  await expect(teacher).toHaveURL(/\/teacher$/);
  await expect(teacher.getByRole("heading", { level: 1, name: "Hello, Asha" })).toBeVisible();
  await expectNoSeriousA11yIssues(teacher);
  await teacher.getByLabel("Class name").fill("10 B Maths");
  await teacher.getByRole("button", { name: "Make class" }).click();
  await expect(teacher).toHaveURL(/\/teacher\/class\?c=/);
  await expect(teacher.getByRole("heading", { level: 1, name: "10 B Maths" })).toBeVisible();
  await expect(teacher.getByText("No check-ups yet")).toBeVisible();
  const code = new URL(teacher.url()).searchParams.get("c")!;
  expect(code).toMatch(/^[A-Z2-9]{6}$/);

  const student = await (await browser.newContext()).newPage();
  await student.goto("/login");
  await expect(student.getByRole("button", { name: /Student/ })).toHaveAttribute("aria-pressed", "true");
  await student.getByLabel("Class code").fill(code.toLowerCase());
  await student.getByLabel(/What should we call you/).fill("Kiran");
  await expectNoSeriousA11yIssues(student);
  await student.getByRole("button", { name: "Join class" }).click();
  await expect(student).toHaveURL(/\/start/);
  await expect(student.getByText("Hi, Kiran! You're in the class")).toBeVisible();
  await student.getByRole("button", { name: /Projectile motion/ }).click();
  await answerAsStudentWithGap(student, "trig-ratios");
  await expect(student.getByText("Shared with your class")).toBeVisible();

  await teacher.getByRole("button", { name: "↻ Refresh" }).click();
  const reteach = teacher.getByRole("region", { name: "What to re-teach" });
  await expect(reteach.getByRole("heading", { name: "Trigonometric ratios" })).toBeVisible();
  await expect(reteach.getByText("1 of 1 check-ups")).toBeVisible();
  await expect(teacher.getByRole("cell", { name: "Projectile motion" })).toBeVisible();
  // The nickname stays on the student's device.
  await expect(teacher.getByText("Kiran")).toHaveCount(0);
  await expectNoSeriousA11yIssues(teacher);

  // Signed out, the dashboard sends you to sign in; signing back in shows the class.
  await teacher.getByRole("link", { name: "← Your classes" }).click();
  await expect(teacher.getByRole("link", { name: /10 B Maths/ })).toContainText("1");
  await teacher.getByRole("button", { name: "Sign out" }).click();
  await expect(teacher).toHaveURL(/\/login$/);
  await teacher.goto(`/teacher/class?c=${code}`);
  await expect(teacher).toHaveURL(/\/login\/teacher/);
  await teacher.getByLabel("Email").fill(email);
  await teacher.getByLabel("Password").fill("correct horse");
  await teacher.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(teacher).toHaveURL(/\/teacher$/);
  await teacher.getByRole("link", { name: /10 B Maths/ }).click();

  await teacher.getByRole("button", { name: "Delete this class" }).click();
  await teacher.getByRole("button", { name: "Yes, delete it" }).click();
  await expect(teacher.getByRole("heading", { name: "Class deleted" })).toBeVisible();
});

test("a wrong password and a wrong class code are explained", async ({ page }) => {
  await page.goto("/login/teacher");
  await page.getByLabel("Email").fill("nobody@school.test");
  await page.getByLabel("Password").fill("whatever");
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "don't match an account" })).toBeVisible();

  await page.goto("/login/student");
  await page.getByLabel("Class code").fill("ZZZZZZ");
  await page.getByRole("button", { name: "Join class" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No class has that code" })).toBeVisible();
  await page.getByRole("link", { name: "Start a check-up without logging in" }).click();
  await page.getByRole("button", { name: /Mole concept/ }).click();
  await expect(page).toHaveURL(/\/check/);
});

test("the old class page sends teachers to sign in", async ({ page }) => {
  await page.goto("/class");
  await expect(page).toHaveURL(/\/login\/teacher/);
  await page.goto("/teacher");
  await expect(page).toHaveURL(/\/login\/teacher/);
});
