import { describe, expect, it } from "vitest";
import { mergeProgress } from "@/lib/progress/merge";
import {
  DAILY_GOAL,
  EMPTY_PROGRESS,
  FREEZE_CAP,
  FREEZE_EVERY,
  MASTERED_BOX,
  dailyAnswered,
  recordAnswer,
  type Progress,
} from "@/lib/progress/progress";
import { parseProgress } from "@/lib/progress/schema";
import { dueCount, sessionGains } from "@/lib/progress/selectors";
import { WORDS } from "@/lib/vocab/words";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date("2026-03-10T12:00:00").getTime();

/** Practise on each of the given day offsets (0 = T0), one answer per day. */
const practiseOn = (days: readonly number[], start: Progress = EMPTY_PROGRESS): Progress =>
  days.reduce((state, offset) => recordAnswer(state, "w", true, T0 + offset * DAY), start);

const consecutive = (count: number): number[] => Array.from({ length: count }, (_, i) => i);

describe("daily goal", () => {
  it("counts every answer given today, right or wrong", () => {
    let state = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    state = recordAnswer(state, "b", false, T0 + 1000);
    expect(dailyAnswered(state, T0 + 2000)).toBe(2);
  });

  it("starts again at one on a new day", () => {
    let state = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    state = recordAnswer(state, "b", true, T0);
    state = recordAnswer(state, "c", true, T0 + DAY);
    expect(dailyAnswered(state, T0 + DAY)).toBe(1);
  });

  it("reports zero for yesterday's count when asked about today", () => {
    const state = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    expect(dailyAnswered(state, T0 + DAY)).toBe(0);
  });

  it("is zero for a brand-new learner and has a sensible goal", () => {
    expect(dailyAnswered(EMPTY_PROGRESS, T0)).toBe(0);
    expect(DAILY_GOAL).toBeGreaterThanOrEqual(10);
  });
});

describe("streak freezes", () => {
  it("earns one freeze for every full week of practice", () => {
    expect(practiseOn(consecutive(FREEZE_EVERY - 1)).freezes).toBe(0);
    expect(practiseOn(consecutive(FREEZE_EVERY)).freezes).toBe(1);
  });

  it("never holds more than the cap", () => {
    expect(practiseOn(consecutive(FREEZE_EVERY * 4)).freezes).toBe(FREEZE_CAP);
  });

  it("spends a freeze to bridge one missed day, so the streak carries on", () => {
    const week = practiseOn(consecutive(FREEZE_EVERY)); // streak 7, one freeze
    const after = recordAnswer(week, "w", true, T0 + (FREEZE_EVERY + 1) * DAY); // skipped one day
    expect(after.streak).toBe(FREEZE_EVERY + 1);
    expect(after.freezes).toBe(0);
  });

  it("spends two freezes to bridge two missed days", () => {
    const fortnight = practiseOn(consecutive(FREEZE_EVERY * 2)); // streak 14, two freezes
    const after = recordAnswer(fortnight, "w", true, T0 + (FREEZE_EVERY * 2 + 2) * DAY);
    expect(after.streak).toBe(FREEZE_EVERY * 2 + 1);
    expect(after.freezes).toBe(0);
  });

  it("starts over when there are not enough freezes for the gap", () => {
    const week = practiseOn(consecutive(FREEZE_EVERY)); // one freeze
    const after = recordAnswer(week, "w", true, T0 + (FREEZE_EVERY + 2) * DAY); // skipped two days
    expect(after.streak).toBe(1);
    expect(after.bestStreak).toBe(FREEZE_EVERY);
  });

  it("starts over with no freezes at all", () => {
    const after = practiseOn([0, 1, 3]);
    expect(after.streak).toBe(1);
  });

  it("does not spend a freeze when you practise on consecutive days", () => {
    const week = practiseOn(consecutive(FREEZE_EVERY));
    const next = recordAnswer(week, "w", true, T0 + FREEZE_EVERY * DAY);
    expect(next.freezes).toBe(1);
    expect(next.streak).toBe(FREEZE_EVERY + 1);
  });

  it("leaves the streak alone if the clock steps backwards", () => {
    const state = practiseOn([0, 1, 2]);
    const after = recordAnswer(state, "w", true, T0 + DAY); // an earlier day than the last one
    expect(after.streak).toBe(3);
  });
});

describe("dueCount", () => {
  it("is zero for a learner who has not started", () => {
    expect(dueCount(WORDS, EMPTY_PROGRESS, T0)).toBe(0);
  });

  it("counts started words whose review time has come, and no others", () => {
    const [a, b] = WORDS;
    let state = recordAnswer(EMPTY_PROGRESS, a.id, false, T0); // wrong: due again in a minute
    state = recordAnswer(state, b.id, true, T0); // right: due in ten minutes
    expect(dueCount(WORDS, state, T0 + 2 * 60 * 1000)).toBe(1);
    expect(dueCount(WORDS, state, T0 + 11 * 60 * 1000)).toBe(2);
  });

  it("ignores saved words that are no longer in the list", () => {
    const state = recordAnswer(EMPTY_PROGRESS, "not-a-real-word", false, T0);
    expect(dueCount(WORDS, state, T0 + DAY)).toBe(0);
  });
});

describe("sessionGains", () => {
  const level1 = WORDS.filter((w) => w.level === 1);

  const master = (state: Progress, id: string): Progress => {
    let next = state;
    for (let i = 0; i < MASTERED_BOX; i++) next = recordAnswer(next, id, true, T0);
    return next;
  };

  it("lists the words that became mastered during the session", () => {
    const before = EMPTY_PROGRESS;
    const after = master(master(before, level1[0].id), level1[1].id);
    const gains = sessionGains(WORDS, before, after);
    expect(gains.newlyMastered.map((w) => w.id).sort()).toEqual([level1[0].id, level1[1].id].sort());
  });

  it("does not list words that were already mastered", () => {
    const before = master(EMPTY_PROGRESS, level1[0].id);
    const after = master(before, level1[1].id);
    expect(sessionGains(WORDS, before, after).newlyMastered.map((w) => w.id)).toEqual([level1[1].id]);
  });

  it("counts words met for the first time", () => {
    const before = recordAnswer(EMPTY_PROGRESS, level1[0].id, true, T0);
    let after = recordAnswer(before, level1[0].id, true, T0);
    after = recordAnswer(after, level1[1].id, true, T0);
    after = recordAnswer(after, level1[2].id, false, T0);
    expect(sessionGains(WORDS, before, after).newlyMet).toBe(2);
  });

  it("reports growth per level", () => {
    const after = master(EMPTY_PROGRESS, level1[0].id);
    const gains = sessionGains(WORDS, EMPTY_PROGRESS, after);
    const hsk1 = gains.byLevel.find((l) => l.level === 1)!;
    expect(hsk1.delta).toBe(1);
    expect(hsk1.after).toBe(1);
    expect(hsk1.total).toBe(level1.length);
    expect(gains.byLevel.filter((l) => l.delta > 0)).toHaveLength(1);
  });
});

describe("merging the new fields", () => {
  it("keeps the larger answer count when both devices practised the same day", () => {
    const a = recordAnswer(EMPTY_PROGRESS, "a", true, T0);
    const b = recordAnswer(recordAnswer(EMPTY_PROGRESS, "b", true, T0), "c", true, T0);
    expect(mergeProgress(a, b).daily.answered).toBe(2);
    expect(mergeProgress(b, a).daily.answered).toBe(2);
  });

  it("takes the count from the most recent day", () => {
    const older = recordAnswer(recordAnswer(EMPTY_PROGRESS, "a", true, T0), "b", true, T0);
    const newer = recordAnswer(EMPTY_PROGRESS, "c", true, T0 + 3 * DAY);
    const merged = mergeProgress(older, newer);
    expect(merged.daily.answered).toBe(1);
    expect(merged.daily.day).toBe(newer.daily.day);
  });

  it("uses the freezes from the side with the fresher streak", () => {
    const week = practiseOn(consecutive(FREEZE_EVERY)); // freezes 1
    const stale = { ...week, freezes: 2, lastDay: "2026-1-1", streak: 1 };
    expect(mergeProgress(stale, week).freezes).toBe(1);
    expect(mergeProgress(week, stale).freezes).toBe(1);
  });
});

describe("reading saved progress", () => {
  it("accepts progress saved before these fields existed", () => {
    const old = {
      words: {},
      xp: 40,
      streak: 3,
      bestStreak: 5,
      lastDay: "2026-3-10",
    };
    const parsed = parseProgress(old);
    expect(parsed).not.toBeNull();
    expect(parsed!.freezes).toBe(0);
    expect(parsed!.daily).toEqual({ day: null, answered: 0 });
    expect(parsed!.xp).toBe(40);
  });

  it("rejects an impossible freeze count", () => {
    expect(parseProgress({ ...EMPTY_PROGRESS, freezes: 99 })).toBeNull();
    expect(parseProgress({ ...EMPTY_PROGRESS, freezes: -1 })).toBeNull();
  });
});
