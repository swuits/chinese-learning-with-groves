import { describe, expect, it } from "vitest";
import { buildChoiceQuestion, buildMatchRound, shuffle } from "@/lib/quiz";
import { WORDS } from "@/lib/vocab/words";

const rng = () => 0.42;

describe("shuffle", () => {
  it("keeps the same items and leaves the input untouched", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, rng);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("buildChoiceQuestion", () => {
  it("offers four unique options including the right answer", () => {
    const target = WORDS[0];
    const q = buildChoiceQuestion(WORDS, target, "hanzi-to-en", rng);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options.map((o) => o.id)).size).toBe(4);
    expect(q.options.some((o) => o.id === target.id)).toBe(true);
    expect(q.answerId).toBe(target.id);
  });

  it("never uses a distractor with the same meaning label as the answer", () => {
    const target = WORDS.find((w) => w.pinyin === "tā")!;
    const q = buildChoiceQuestion(WORDS, target, "pinyin-to-en", rng);
    const labels = q.options.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("prompts with hanzi and answers with english for hanzi-to-en", () => {
    const target = WORDS[0];
    const q = buildChoiceQuestion(WORDS, target, "hanzi-to-en", rng);
    expect(q.prompt).toBe(target.hanzi);
    expect(q.options.find((o) => o.id === target.id)?.label).toBe(target.en);
  });

  it("works with a tiny pool by using what is available", () => {
    const pool = WORDS.slice(0, 3);
    const q = buildChoiceQuestion(pool, pool[0], "hanzi-to-en", rng);
    expect(q.options).toHaveLength(3);
  });
});

describe("buildMatchRound", () => {
  it("creates two tiles per word and every pair shares a pairId", () => {
    const round = buildMatchRound(WORDS.slice(0, 6), rng);
    expect(round).toHaveLength(12);
    const counts = new Map<string, number>();
    round.forEach((t) => counts.set(t.pairId, (counts.get(t.pairId) ?? 0) + 1));
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
  });

  it("has one hanzi tile and one english tile per pair", () => {
    const round = buildMatchRound(WORDS.slice(0, 4), rng);
    const first = round.filter((t) => t.pairId === WORDS[0].id);
    expect(first.map((t) => t.side).sort()).toEqual(["en", "hanzi"]);
  });
});
