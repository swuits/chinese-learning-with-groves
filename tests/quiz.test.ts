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

describe("fair distractors", () => {
  const pick = (hanzi: string) => WORDS.find((w) => w.hanzi === hanzi)!;

  it("never offers a word that sounds identical when the prompt is pinyin", () => {
    // 做 and 坐 are both "zuò": showing "zuò" with both as answers would be unfair.
    const pool = [pick("做"), pick("坐"), pick("吃"), pick("喝"), pick("看")];
    for (let i = 0; i < 25; i++) {
      const q = buildChoiceQuestion(pool, pool[0], "pinyin-to-en", Math.random);
      expect(q.options.map((o) => o.id)).not.toContain("坐");
      expect(q.options).toHaveLength(4);
    }
  });

  it("still offers homophones when the prompt is not pinyin", () => {
    const pool = [pick("做"), pick("坐")];
    const q = buildChoiceQuestion(pool, pool[0], "hanzi-to-en", Math.random);
    expect(q.options.map((o) => o.id).sort()).toEqual(["做", "坐"].sort());
  });

  it("never puts near-synonyms in the same question", () => {
    // 大概 ("roughly") and 大约 ("about") would both be right answers.
    const pool = [pick("大概"), pick("大约"), pick("因为"), pick("如果"), pick("虽然")];
    for (let i = 0; i < 25; i++) {
      const q = buildChoiceQuestion(pool, pool[0], "hanzi-to-en", Math.random);
      expect(q.options.map((o) => o.id)).not.toContain("大约");
      expect(q.options).toHaveLength(4);
    }
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
