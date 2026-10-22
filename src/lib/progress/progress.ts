import { shuffle } from "@/lib/shuffle";
import type { Word } from "@/lib/vocab/types";

export interface WordProgress {
  readonly box: number;
  readonly seen: number;
  readonly correct: number;
  readonly wrong: number;
  readonly due: number;
}

export interface Progress {
  readonly words: Readonly<Record<string, WordProgress>>;
  readonly xp: number;
  readonly streak: number;
  readonly bestStreak: number;
  readonly lastDay: string | null;
}

export const EMPTY_PROGRESS: Progress = {
  words: {},
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastDay: null,
};

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const MAX_BOX = 5;
export const MASTERED_BOX = 4;
export const XP_PER_CORRECT = 10;

/** Leitner schedule: how long to wait before a word in each box comes back. */
const BOX_DELAY_MS: readonly number[] = [
  MINUTE,
  10 * MINUTE,
  DAY,
  3 * DAY,
  7 * DAY,
  21 * DAY,
];

const FRESH_WORD: WordProgress = { box: 0, seen: 0, correct: 0, wrong: 0, due: 0 };

const dayKey = (time: number): string => {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const dayNumber = (key: string): number => {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
};

const nextStreak = (state: Progress, now: number): number => {
  const today = dayKey(now);
  if (state.lastDay === today) return state.streak;
  if (state.lastDay === null) return 1;
  return dayNumber(today) - dayNumber(state.lastDay) === 1 ? state.streak + 1 : 1;
};

export const recordAnswer = (
  state: Progress,
  wordId: string,
  isCorrect: boolean,
  now: number,
): Progress => {
  const prev = state.words[wordId] ?? FRESH_WORD;
  const box = isCorrect ? Math.min(prev.box + 1, MAX_BOX) : 0;
  const streak = nextStreak(state, now);

  return {
    words: {
      ...state.words,
      [wordId]: {
        box,
        seen: prev.seen + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        due: now + BOX_DELAY_MS[box],
      },
    },
    xp: state.xp + (isCorrect ? XP_PER_CORRECT : 0),
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastDay: dayKey(now),
  };
};

const XP_PER_LEVEL = 100;

export interface LevelInfo {
  level: number;
  into: number;
  needed: number;
}

/** Each level asks for a little more xp than the last. */
export const levelFromXp = (xp: number): LevelInfo => {
  let level = 1;
  let remaining = xp;
  let needed = XP_PER_LEVEL;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = XP_PER_LEVEL + (level - 1) * 25;
  }
  return { level, into: remaining, needed };
};

export const masteredCount = (state: Progress): number =>
  Object.values(state.words).filter((w) => w.box >= MASTERED_BOX).length;

export const wordsSeenCount = (state: Progress): number => Object.keys(state.words).length;

/** Due reviews first (most overdue on top), then brand-new words, then the rest. */
export const pickSession = (
  pool: readonly Word[],
  state: Progress,
  count: number,
  now: number,
  rng: () => number = Math.random,
): Word[] => {
  const due = pool
    .filter((w) => state.words[w.id] && state.words[w.id].due <= now)
    .sort((a, b) => state.words[a.id].due - state.words[b.id].due);
  const fresh = shuffle(
    pool.filter((w) => !state.words[w.id]),
    rng,
  );
  const waiting = shuffle(
    pool.filter((w) => state.words[w.id] && state.words[w.id].due > now),
    rng,
  );
  return [...due, ...fresh, ...waiting].slice(0, count);
};
