import type { Category, Level, Word } from "@/lib/vocab/types";
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
