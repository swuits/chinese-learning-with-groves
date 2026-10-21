import type { Category, Word } from "@/lib/vocab/types";
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
