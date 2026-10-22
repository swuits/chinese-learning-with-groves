import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

// Random per run, so test accounts never share a guessable password.
const PASSWORD = `Gv-${randomUUID()}`;

// Unique per run; cleaned up afterwards with: delete from auth.users where email like 'groves-e2e-%'
const newEmail = () => `groves-e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page, email: string, path = "/login") {
  await page.goto(path);
  await page.getByLabel(/What should we call you/).fill("Mei");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Create my account/ }).click();
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  // Sign-out is async (it syncs first), so wait until the header really shows signed-out.
  await expect(page.getByRole("link", { name: "Join free" })).toBeVisible();
}

async function playQuiz(page: Page) {
  await page.getByRole("button", { name: /Start/ }).click();
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: /^1\s/ }).click();
    await page.getByRole("button", { name: /Next|See results/ }).click();
  }
  await expect(page.getByText(/right/)).toBeVisible();
}

test("signed-out visitors see the pitch and are sent to sign up for games", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Grow a grove");
  await expect(page.getByRole("link", { name: /Create a free account/ })).toBeVisible();

  await page.goto("/quiz");
  await expect(page).toHaveURL(/\/login\?next=%2Fquiz/);
  await expect(page.getByRole("heading", { name: "Plant your grove" })).toBeVisible();
});

test("sign-up validates input before talking to the server", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: /Create my account/ }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText(/at least 8 characters/i).last()).toBeVisible();
});

test("a new account lands where they were going, plays, and progress follows them to a fresh device", async ({
  page,
}) => {
  const email = newEmail();

  await page.goto("/quiz");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel(/What should we call you/).fill("Mei");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Create my account/ }).click();

  await expect(page).toHaveURL(/\/quiz$/);
  await playQuiz(page);

  // The account menu shows when progress has reached the cloud.
  await page.getByRole("button", { name: /Account menu for Mei/ }).click();
  await expect(page.getByText("Progress saved to your account")).toBeVisible({ timeout: 15_000 });

  // Sign out, wipe everything the browser remembers, sign back in: the cloud must restore it.
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: /Create a free account/ })).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.goto("/login?mode=signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^Sign in/ }).click();
  // A deployed server can take a few seconds on a cold start.
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/, { timeout: 20_000 });

  const met = page.getByText("met", { exact: true }).locator("xpath=preceding-sibling::p");
  await expect(met).toHaveText("10", { timeout: 15_000 });
});

test("a wrong password gets a clear message and keeps the email", async ({ page }) => {
  const email = newEmail();
  await signUp(page, email);
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  await signOut(page);

  await page.goto("/login?mode=signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("definitely-wrong-1");
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("don't match");
  await expect(page.getByLabel("Email")).toHaveValue(email);
});

test("a duplicate email is rejected with a helpful message", async ({ page }) => {
  const email = newEmail();
  await signUp(page, email);
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  await signOut(page);

  await signUp(page, email);
  await expect(page.locator("form").getByRole("alert")).toContainText("already exists");
});

test("a crafted next link can never send someone to another site", async ({ page }) => {
  await signUp(page, newEmail(), "/login?next=//evil.example/steal");
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
});

test("signed-in visitors skip the login page", async ({ page }) => {
  await signUp(page, newEmail());
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
});

test("the hear-it button plays a real recording and returns to ready", async ({ page }) => {
  await signUp(page, newEmail(), "/login?next=/learn");
  await expect(page).toHaveURL(/\/learn$/, { timeout: 20_000 });

  // The recording is fetched as soon as the card appears, so listen before starting.
  const recording = page.waitForResponse((r) => r.url().includes("/audio/") && r.ok());
  await page.getByRole("button", { name: /Start/ }).click();
  await page.getByRole("button", { name: /Tap to reveal/ }).click();

  const response = await recording;
  expect(response.headers()["content-type"]).toContain("audio/mpeg");

  const hear = page.getByRole("button", { name: /^Hear it/ });
  await hear.click();
  await expect(hear).toContainText("Playing…");
  await expect(hear).toContainText("Hear it", { timeout: 5_000 });
});
