import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, recordAnswer } from "@/lib/progress/progress";
import { mergeProgress } from "@/lib/progress/merge";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date("2026-03-10T12:00:00").getTime();

describe("mergeProgress", () => {
  it("keeps words learned on either side", () => {
    const a = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    const b = recordAnswer(EMPTY_PROGRESS, "b", true, T0);
    const merged = mergeProgress(a, b);
    expect(Object.keys(merged.words).sort()).toEqual(["a", "b"]);
  });

  it("prefers the side that has seen a word more often", () => {
    const once = recordAnswer(EMPTY_PROGRESS, "w", true, T0);
    const twice = recordAnswer(once, "w", true, T0);
    expect(mergeProgress(once, twice).words.w.seen).toBe(2);
    expect(mergeProgress(twice, once).words.w.seen).toBe(2);
  });

  it("takes the larger xp and best streak", () => {
    const a = { ...recordAnswer(EMPTY_PROGRESS, "a", true, T0), bestStreak: 9 };
    const b = recordAnswer(recordAnswer(EMPTY_PROGRESS, "b", true, T0), "b", true, T0);
    const merged = mergeProgress(a, b);
    expect(merged.xp).toBe(Math.max(a.xp, b.xp));
    expect(merged.bestStreak).toBe(9);
  });

  it("uses the streak from whichever side practiced most recently", () => {
    const older = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    const newer = recordAnswer(recordAnswer(EMPTY_PROGRESS, "a", true, T0 + 8 * DAY), "a", true, T0 + 9 * DAY);
    const merged = mergeProgress(older, newer);
    expect(merged.streak).toBe(newer.streak);
    expect(merged.lastDay).toBe(newer.lastDay);
  });

  it("compares days as dates, not as text (month 10 is after month 3)", () => {
    const march = recordAnswer(EMPTY_PROGRESS, "a", true, new Date("2026-03-10T12:00:00").getTime());
    const october = recordAnswer(
      recordAnswer(EMPTY_PROGRESS, "a", true, new Date("2026-10-02T12:00:00").getTime()),
      "a",
      true,
      new Date("2026-10-03T12:00:00").getTime(),
    );
    expect(mergeProgress(march, october).streak).toBe(october.streak);
    expect(mergeProgress(october, march).streak).toBe(october.streak);
  });

  it("is a no-op against empty progress and idempotent", () => {
    const a = recordAnswer(recordAnswer(EMPTY_PROGRESS, "a", true, T0), "b", false, T0);
    expect(mergeProgress(EMPTY_PROGRESS, a)).toEqual(a);
    expect(mergeProgress(a, EMPTY_PROGRESS)).toEqual(a);
    expect(mergeProgress(a, a)).toEqual(a);
  });

  it("does not mutate its inputs", () => {
    const a = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    const b = recordAnswer(EMPTY_PROGRESS, "b", true, T0);
    const before = JSON.stringify([a, b]);
    mergeProgress(a, b);
    expect(JSON.stringify([a, b])).toBe(before);
  });
});
