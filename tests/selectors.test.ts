import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, MASTERED_BOX, recordAnswer } from "@/lib/progress/progress";
import { categoryStats } from "@/lib/progress/selectors";
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
