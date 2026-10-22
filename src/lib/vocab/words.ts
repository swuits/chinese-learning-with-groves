import { HSK1 } from "./lists/hsk1";
import { HSK2 } from "./lists/hsk2";
import { HSK3 } from "./lists/hsk3";
import { HSK4A } from "./lists/hsk4a";
import { HSK4B } from "./lists/hsk4b";
import type { Category, Level, Word, WordRow } from "./types";

// The hanzi doubles as the id: every word is unique, and the audio file name derives from it.
const build = (level: Level, rows: readonly WordRow[]): Word[] =>
  rows.map(([hanzi, pinyin, en, category]) => ({ id: hanzi, hanzi, pinyin, en, category, level }));

export const WORDS: readonly Word[] = [
  ...build(1, HSK1),
  ...build(2, HSK2),
  ...build(3, HSK3),
  ...build(4, HSK4A),
  ...build(4, HSK4B),
];

export const wordsByCategory = (category: Category): Word[] =>
  WORDS.filter((word) => word.category === category);
