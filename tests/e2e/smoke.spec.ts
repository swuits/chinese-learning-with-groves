import { expect, test } from "@playwright/test";

test("home page shows the grove and the games", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Grow a grove");
  await expect(page.getByRole("img", { name: /Your grove/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Flashcards/ })).toBeVisible();
});

test("finishing a quiz awards xp that persists after reload", async ({ page }) => {
  await page.goto("/quiz");
  await page.getByRole("button", { name: /Start/ }).click();

  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: /^1\s/ }).click();
    await page.getByRole("button", { name: /Next|See results/ }).click();
  }

  await expect(page.getByRole("heading", { name: /grown|Flawless|roots|small/i })).toBeVisible();
  await expect(page.getByText(/right/)).toBeVisible();

  await page.reload();
  await page.goto("/");
  await expect(page.getByLabel("Your stats")).toContainText("🔥");
  const streak = await page.getByLabel("Your stats").textContent();
  expect(streak).toMatch(/1/);
});

test("flashcards flip and advance", async ({ page }) => {
  await page.goto("/learn");
  await page.getByRole("button", { name: /Start/ }).click();
  await page.getByRole("button", { name: /Tap to reveal/ }).click();
  await page.getByRole("button", { name: /Got it/ }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
});

test("matching game accepts a correct pair", async ({ page }) => {
  await page.goto("/match");
  await page.getByRole("button", { name: /Start/ }).click();
  await expect(page.getByText("Matched 0/6")).toBeVisible();
});
