import { describe, expect, it } from "vitest";
import { loginSchema, safeNextPath, signupSchema } from "@/lib/auth/schemas";
import { EMPTY_PROGRESS, recordAnswer } from "@/lib/progress/progress";
import { parseProgress } from "@/lib/progress/schema";

describe("signupSchema", () => {
  const valid = { email: "learner@example.com", password: "bamboo-grove-88", displayName: "Mei" };

  it("accepts a valid sign-up and trims the display name", () => {
    const result = signupSchema.safeParse({ ...valid, displayName: "  Mei  " });
    expect(result.success && result.data.displayName).toBe("Mei");
  });

  it("lowercases and trims the email", () => {
    const result = signupSchema.safeParse({ ...valid, email: "  Learner@Example.COM " });
    expect(result.success && result.data.email).toBe("learner@example.com");
  });

  it("rejects a bad email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("requires at least 8 characters in the password", () => {
    expect(signupSchema.safeParse({ ...valid, password: "short7!" }).success).toBe(false);
  });

  it("rejects passwords over 72 characters, the limit Supabase hashes", () => {
    expect(signupSchema.safeParse({ ...valid, password: "x".repeat(73) }).success).toBe(false);
  });

  it("treats a blank display name as not provided", () => {
    const result = signupSchema.safeParse({ ...valid, displayName: "   " });
    expect(result.success && result.data.displayName).toBeUndefined();
  });

  it("rejects an overly long display name", () => {
    expect(signupSchema.safeParse({ ...valid, displayName: "m".repeat(41) }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("only needs an email and a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows plain in-site paths", () => {
    expect(safeNextPath("/quiz")).toBe("/quiz");
    expect(safeNextPath("/learn?x=1")).toBe("/learn?x=1");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "quiz",
    "",
    null,
    undefined,
  ])("falls back to home for %s", (input) => {
    expect(safeNextPath(input)).toBe("/");
  });

  it("never sends people back to the login page", () => {
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/login?next=/quiz")).toBe("/");
  });
});

describe("parseProgress", () => {
  it("round-trips real progress", () => {
    const progress = recordAnswer(EMPTY_PROGRESS, "w", true, 1000);
    expect(parseProgress(JSON.parse(JSON.stringify(progress)))).toEqual(progress);
  });

  it("accepts an empty object from a brand-new cloud row as no progress", () => {
    expect(parseProgress({})).toBeNull();
  });

  it.each([
    ["a string", "hello"],
    ["null", null],
    ["a negative xp", { ...EMPTY_PROGRESS, xp: -5 }],
    ["a box above the maximum", { ...EMPTY_PROGRESS, words: { w: { box: 99, seen: 1, correct: 1, wrong: 0, due: 0 } } }],
    ["a word with missing fields", { ...EMPTY_PROGRESS, words: { w: { box: 1 } } }],
    ["a non-integer streak", { ...EMPTY_PROGRESS, streak: 1.5 }],
  ])("rejects %s", (_label, value) => {
    expect(parseProgress(value)).toBeNull();
  });
});
