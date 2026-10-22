import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  MASTERED_BOX,
  levelFromXp,
  masteredCount,
  pickSession,
  recordAnswer,
} from "@/lib/progress/progress";
import { WORDS } from "@/lib/vocab/words";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date("2026-03-10T12:00:00").getTime();

describe("recordAnswer", () => {
  it("awards xp and promotes the box on a correct answer", () => {
    const next = recordAnswer(EMPTY_PROGRESS, "w1", true, T0);
    expect(next.xp).toBeGreaterThan(0);
    expect(next.words.w1.box).toBe(1);
    expect(next.words.w1.correct).toBe(1);
  });

  it("drops the box back to 0 on a wrong answer and keeps xp", () => {
    const up = recordAnswer(recordAnswer(EMPTY_PROGRESS, "w1", true, T0), "w1", true, T0);
    const down = recordAnswer(up, "w1", false, T0);
    expect(down.words.w1.box).toBe(0);
    expect(down.words.w1.wrong).toBe(1);
    expect(down.xp).toBe(up.xp);
  });

  it("never exceeds the top box", () => {
    let state = EMPTY_PROGRESS;
    for (let i = 0; i < 20; i++) state = recordAnswer(state, "w1", true, T0);
    expect(state.words.w1.box).toBe(5);
  });

  it("does not mutate the previous state", () => {
    const before = JSON.stringify(EMPTY_PROGRESS);
    recordAnswer(EMPTY_PROGRESS, "w1", true, T0);
    expect(JSON.stringify(EMPTY_PROGRESS)).toBe(before);
  });

  it("schedules the next review further out in higher boxes", () => {
    const one = recordAnswer(EMPTY_PROGRESS, "w1", true, T0).words.w1.due;
    let state = EMPTY_PROGRESS;
    for (let i = 0; i < 4; i++) state = recordAnswer(state, "w1", true, T0);
    expect(state.words.w1.due).toBeGreaterThan(one);
  });
});

describe("streaks", () => {
  it("starts at 1 on the first answer", () => {
    expect(recordAnswer(EMPTY_PROGRESS, "w1", true, T0).streak).toBe(1);
  });

  it("stays the same when practicing twice on the same day", () => {
    const a = recordAnswer(EMPTY_PROGRESS, "w1", true, T0);
    const b = recordAnswer(a, "w2", true, T0 + 1000);
    expect(b.streak).toBe(1);
  });

  it("grows on consecutive days", () => {
    const a = recordAnswer(EMPTY_PROGRESS, "w1", true, T0);
    const b = recordAnswer(a, "w1", true, T0 + DAY);
    expect(b.streak).toBe(2);
    expect(b.bestStreak).toBe(2);
  });

  it("resets after a missed day but remembers the best", () => {
    const a = recordAnswer(recordAnswer(EMPTY_PROGRESS, "w1", true, T0), "w1", true, T0 + DAY);
    const b = recordAnswer(a, "w1", true, T0 + 4 * DAY);
    expect(b.streak).toBe(1);
    expect(b.bestStreak).toBe(2);
  });
});

describe("levelFromXp", () => {
  it("starts at level 1 and rises with xp", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(10_000).level).toBeGreaterThan(levelFromXp(100).level);
  });

  it("reports progress toward the next level between 0 and 1", () => {
    const { into, needed } = levelFromXp(75);
    expect(into).toBeGreaterThanOrEqual(0);
    expect(into).toBeLessThan(needed);
  });
});

describe("masteredCount", () => {
  it("counts only words in the mastered box or above", () => {
    let state = EMPTY_PROGRESS;
    for (let i = 0; i < MASTERED_BOX; i++) state = recordAnswer(state, "a", true, T0);
    state = recordAnswer(state, "b", true, T0);
    expect(masteredCount(state)).toBe(1);
  });
});

describe("pickSession", () => {
  it("returns the requested number of unique words", () => {
    const picked = pickSession(WORDS, EMPTY_PROGRESS, 10, T0, () => 0.5);
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((w) => w.id)).size).toBe(10);
  });

  it("puts due words before new words", () => {
    const target = WORDS[5];
    const state = recordAnswer(EMPTY_PROGRESS, target.id, false, T0);
    const picked = pickSession(WORDS, state, 5, T0 + DAY, () => 0.5);
    expect(picked[0].id).toBe(target.id);
  });

  it("introduces brand-new words from the lowest level first", () => {
    const picked = pickSession(WORDS, EMPTY_PROGRESS, 20, T0, () => 0.5);
    expect(picked.every((w) => w.level === 1)).toBe(true);
  });

  it("moves on to the next level once the lower one is all started", () => {
    let state = EMPTY_PROGRESS;
    for (const w of WORDS.filter((x) => x.level === 1)) state = recordAnswer(state, w.id, true, T0);
    const picked = pickSession(WORDS, state, 10, T0, () => 0.5);
    expect(picked.every((w) => w.level === 2)).toBe(true);
  });

  it("does not return more words than exist", () => {
    expect(pickSession(WORDS.slice(0, 3), EMPTY_PROGRESS, 10, T0, () => 0.5)).toHaveLength(3);
  });
});
