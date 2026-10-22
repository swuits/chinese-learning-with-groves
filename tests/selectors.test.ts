import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, MASTERED_BOX, recordAnswer } from "@/lib/progress/progress";
import { categoryStats, levelStats } from "@/lib/progress/selectors";
import { WORDS } from "@/lib/vocab/words";

describe("categoryStats", () => {
  it("reports zero mastery for a fresh learner", () => {
    const [stat] = categoryStats(WORDS, EMPTY_PROGRESS, ["greetings"]);
    expect(stat.mastered).toBe(0);
    expect(stat.ratio).toBe(0);
    expect(stat.total).toBeGreaterThan(0);
  });

  it("counts mastered words per category", () => {
    const word = WORDS.find((w) => w.category === "food")!;
    let state = EMPTY_PROGRESS;
    for (let i = 0; i < MASTERED_BOX; i++) state = recordAnswer(state, word.id, true, 0);
    const [food, greetings] = categoryStats(WORDS, state, ["food", "greetings"]);
    expect(food.mastered).toBe(1);
    expect(greetings.mastered).toBe(0);
    expect(food.ratio).toBeCloseTo(1 / food.total);
  });
});

describe("levelStats", () => {
  it("reports every level with its size", () => {
    const stats = levelStats(WORDS, EMPTY_PROGRESS, [1, 2, 3, 4]);
    expect(stats.map((s) => s.level)).toEqual([1, 2, 3, 4]);
    expect(stats.every((s) => s.total > 0 && s.mastered === 0 && s.ratio === 0)).toBe(true);
  });

  it("counts mastered words in the right level", () => {
    const word = WORDS.find((w) => w.level === 3)!;
    let state = EMPTY_PROGRESS;
    for (let i = 0; i < MASTERED_BOX; i++) state = recordAnswer(state, word.id, true, 0);
    const stats = levelStats(WORDS, state, [1, 3]);
    expect(stats[0].mastered).toBe(0);
    expect(stats[1].mastered).toBe(1);
    expect(stats[1].ratio).toBeCloseTo(1 / stats[1].total);
  });
});
