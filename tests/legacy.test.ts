import { describe, expect, it } from "vitest";
import { migrateLegacyIds } from "@/lib/progress/legacy";
import { EMPTY_PROGRESS, recordAnswer } from "@/lib/progress/progress";
import { parseProgress } from "@/lib/progress/schema";

const T0 = new Date("2026-03-10T12:00:00").getTime();

describe("migrateLegacyIds", () => {
  it("renames old topic-prefixed ids to the plain word", () => {
    const old = recordAnswer(recordAnswer(EMPTY_PROGRESS, "greetings-你好", true, T0), "food-茶", false, T0);
    const migrated = migrateLegacyIds(old);
    expect(Object.keys(migrated.words).sort()).toEqual(["你好", "茶"].sort());
    expect(migrated.words["你好"].correct).toBe(1);
  });

  it("keeps xp, streak and everything else", () => {
    const old = recordAnswer(EMPTY_PROGRESS, "people-我", true, T0);
    const migrated = migrateLegacyIds(old);
    expect(migrated.xp).toBe(old.xp);
    expect(migrated.streak).toBe(old.streak);
    expect(migrated.lastDay).toBe(old.lastDay);
  });

  it("keeps the better record when the old and new id both exist", () => {
    let progress = recordAnswer(EMPTY_PROGRESS, "people-我", true, T0);
    progress = recordAnswer(progress, "people-我", true, T0);
    progress = recordAnswer(progress, "我", true, T0);
    expect(migrateLegacyIds(progress).words["我"].seen).toBe(2);
  });

  it("returns the same object when there is nothing to migrate", () => {
    const fresh = recordAnswer(EMPTY_PROGRESS, "你好", true, T0);
    expect(migrateLegacyIds(fresh)).toBe(fresh);
  });

  it("does not mutate its input", () => {
    const old = recordAnswer(EMPTY_PROGRESS, "greetings-你好", true, T0);
    const before = JSON.stringify(old);
    migrateLegacyIds(old);
    expect(JSON.stringify(old)).toBe(before);
  });

  it("is applied whenever saved progress is read", () => {
    const old = recordAnswer(EMPTY_PROGRESS, "greetings-你好", true, T0);
    const parsed = parseProgress(JSON.parse(JSON.stringify(old)));
    expect(Object.keys(parsed!.words)).toEqual(["你好"]);
  });
});
