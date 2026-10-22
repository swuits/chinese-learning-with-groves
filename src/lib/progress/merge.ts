import { dayNumber, type DailyCount, type Progress, type WordProgress } from "./progress";

export const pickWord = (a: WordProgress, b: WordProgress): WordProgress => {
  if (a.seen !== b.seen) return a.seen > b.seen ? a : b;
  return a.due >= b.due ? a : b;
};

const dayOrMin = (key: string | null): number => (key === null ? -Infinity : dayNumber(key));

/** The side whose streak is more current wins; on the same day the longer streak wins. */
const pickStreakSide = (a: Progress, b: Progress): Progress => {
  const dayA = dayOrMin(a.lastDay);
  const dayB = dayOrMin(b.lastDay);
  if (dayA !== dayB) return dayA > dayB ? a : b;
  return a.streak >= b.streak ? a : b;
};

/** The more recent day wins; on the same day the higher count wins. */
const pickDaily = (a: DailyCount, b: DailyCount): DailyCount => {
  const dayA = dayOrMin(a.day);
  const dayB = dayOrMin(b.day);
  if (dayA !== dayB) return dayA > dayB ? a : b;
  return a.answered >= b.answered ? a : b;
};

/**
 * Combines progress from two devices without losing either: every word is kept (the more
 * practiced copy wins), xp and best streak never go down, and the fresher streak is used.
 */
export const mergeProgress = (a: Progress, b: Progress): Progress => {
  const ids = new Set([...Object.keys(a.words), ...Object.keys(b.words)]);
  const words: Record<string, WordProgress> = {};
  for (const id of ids) {
    const left = a.words[id];
    const right = b.words[id];
    words[id] = left && right ? pickWord(left, right) : (left ?? right);
  }

  const streakSide = pickStreakSide(a, b);
  return {
    words,
    xp: Math.max(a.xp, b.xp),
    streak: streakSide.streak,
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    lastDay: streakSide.lastDay,
    daily: pickDaily(a.daily, b.daily),
    // Freezes are spent as days pass, so the side whose streak is current knows the true number.
    freezes: streakSide.freezes,
  };
};

const sameWord = (a: WordProgress, b: WordProgress): boolean =>
  a.box === b.box && a.seen === b.seen && a.correct === b.correct && a.wrong === b.wrong && a.due === b.due;

export const sameProgress = (a: Progress, b: Progress): boolean => {
  const idsA = Object.keys(a.words);
  if (idsA.length !== Object.keys(b.words).length) return false;
  return (
    a.xp === b.xp &&
    a.streak === b.streak &&
    a.bestStreak === b.bestStreak &&
    a.lastDay === b.lastDay &&
    a.freezes === b.freezes &&
    a.daily.day === b.daily.day &&
    a.daily.answered === b.daily.answered &&
    idsA.every((id) => b.words[id] !== undefined && sameWord(a.words[id], b.words[id]))
  );
};
