import { LEVELS, type Category, type Level, type Word } from "@/lib/vocab/types";
import { MASTERED_BOX, type Progress } from "./progress";

export interface CategoryStat {
  category: Category;
  total: number;
  mastered: number;
  ratio: number;
}

export const categoryStats = (
  words: readonly Word[],
  state: Progress,
  categories: readonly Category[],
): CategoryStat[] =>
  categories.map((category) => {
    const inCategory = words.filter((w) => w.category === category);
    const mastered = inCategory.filter(
      (w) => (state.words[w.id]?.box ?? 0) >= MASTERED_BOX,
    ).length;
    return {
      category,
      total: inCategory.length,
      mastered,
      ratio: inCategory.length === 0 ? 0 : mastered / inCategory.length,
    };
  });

export interface LevelStat {
  level: Level;
  total: number;
  mastered: number;
  ratio: number;
}

export const levelStats = (
  words: readonly Word[],
  state: Progress,
  levels: readonly Level[],
): LevelStat[] =>
  levels.map((level) => {
    const inLevel = words.filter((w) => w.level === level);
    const mastered = inLevel.filter((w) => (state.words[w.id]?.box ?? 0) >= MASTERED_BOX).length;
    return {
      level,
      total: inLevel.length,
      mastered,
      ratio: inLevel.length === 0 ? 0 : mastered / inLevel.length,
    };
  });

/** Words the learner has started whose next review time has arrived. */
export const dueCount = (words: readonly Word[], state: Progress, now: number): number =>
  words.filter((w) => {
    const entry = state.words[w.id];
    return entry !== undefined && entry.due <= now;
  }).length;

export interface LevelGain {
  level: Level;
  before: number;
  after: number;
  delta: number;
  total: number;
}

export interface SessionGains {
  newlyMastered: Word[];
  newlyMet: number;
  byLevel: LevelGain[];
}

const isMastered = (state: Progress, id: string): boolean => (state.words[id]?.box ?? 0) >= MASTERED_BOX;

/** What a practice session changed: words newly mastered, words met for the first time, growth per level. */
export const sessionGains = (words: readonly Word[], before: Progress, after: Progress): SessionGains => {
  const newlyMastered = words.filter((w) => isMastered(after, w.id) && !isMastered(before, w.id));
  const newlyMet = words.filter((w) => after.words[w.id] !== undefined && before.words[w.id] === undefined).length;
  const beforeStats = levelStats(words, before, LEVELS);
  const afterStats = levelStats(words, after, LEVELS);
  const byLevel = afterStats.map((stat, i) => ({
    level: stat.level,
    before: beforeStats[i].mastered,
    after: stat.mastered,
    delta: stat.mastered - beforeStats[i].mastered,
    total: stat.total,
  }));
  return { newlyMastered, newlyMet, byLevel };
};
