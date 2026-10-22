import { describe, expect, it } from "vitest";
import { SYNONYM_GROUPS, areConfusable } from "@/lib/vocab/synonyms";
import { CATEGORY_META, LEVELS } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";

describe("word list", () => {
  it("is big enough to keep learners busy", () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(1100);
  });

  it("covers every level", () => {
    for (const level of LEVELS) {
      expect(WORDS.filter((w) => w.level === level).length, `level ${level}`).toBeGreaterThan(100);
    }
  });

  it("gives every word a unique id and a unique hanzi", () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w.hanzi)).size).toBe(WORDS.length);
  });

  it("gives every word a distinct English meaning, so a quiz never has two right answers", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const word of WORDS) {
      const key = word.en.trim().toLowerCase();
      const earlier = seen.get(key);
      if (earlier) clashes.push(`${earlier} and ${word.hanzi} are both "${word.en}"`);
      seen.set(key, word.hanzi);
    }
    expect(clashes).toEqual([]);
  });

  it("only uses known topics and has a few words in each", () => {
    for (const word of WORDS) expect(CATEGORY_META[word.category], word.hanzi).toBeDefined();
    for (const category of Object.keys(CATEGORY_META)) {
      expect(WORDS.filter((w) => w.category === category).length, category).toBeGreaterThanOrEqual(10);
    }
  });

  it("writes pinyin with tone marks, never digits or stray symbols", () => {
    const pinyin = /^[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' ]+$/;
    const bad = WORDS.filter((w) => !pinyin.test(w.pinyin)).map((w) => `${w.hanzi}: ${w.pinyin}`);
    expect(bad).toEqual([]);
  });

  it("has no empty fields", () => {
    for (const w of WORDS) {
      expect(w.hanzi.trim() && w.pinyin.trim() && w.en.trim(), w.id).toBeTruthy();
    }
  });
});

describe("synonym groups", () => {
  const hanzi = new Set(WORDS.map((w) => w.hanzi));

  it("only mention words that exist", () => {
    const missing = SYNONYM_GROUPS.flat().filter((h) => !hanzi.has(h));
    expect(missing).toEqual([]);
  });

  it("each hold at least two words", () => {
    for (const group of SYNONYM_GROUPS) expect(group.length).toBeGreaterThanOrEqual(2);
  });

  it("flag words in the same group as confusable, and unrelated words as not", () => {
    expect(areConfusable("大概", "大约")).toBe(true);
    expect(areConfusable("大约", "大概")).toBe(true);
    expect(areConfusable("大概", "苹果")).toBe(false);
    expect(areConfusable("苹果", "苹果")).toBe(false);
  });
});
