import { shuffle } from "@/lib/shuffle";
import { LEVELS, type Word } from "@/lib/vocab/types";

export interface WordProgress {
  readonly box: number;
  readonly seen: number;
  readonly correct: number;
  readonly wrong: number;
  readonly due: number;
}

/** How many answers the learner has given on one calendar day (the day is stored as a key). */
export interface DailyCount {
  readonly day: string | null;
  readonly answered: number;
}

export interface Progress {
  readonly words: Readonly<Record<string, WordProgress>>;
  readonly xp: number;
  readonly streak: number;
  readonly bestStreak: number;
  readonly lastDay: string | null;
  readonly daily: DailyCount;
  /** Spare days: each one quietly covers a missed day so the streak survives. */
  readonly freezes: number;
}

export const EMPTY_PROGRESS: Progress = {
  words: {},
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  daily: { day: null, answered: 0 },
  freezes: 0,
};

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const MAX_BOX = 5;
export const MASTERED_BOX = 4;
export const XP_PER_CORRECT = 10;
export const DAILY_GOAL = 20;
export const FREEZE_EVERY = 7;
export const FREEZE_CAP = 2;

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

export const dayKey = (time: number): string => {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const dayNumber = (key: string): number => {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
};

/**
 * The calendar day an answer counts towards: today, unless the clock has stepped back behind the
 * last practice day (a changed time zone, say), in which case the later day stays in force.
 */
const effectiveDay = (state: Progress, now: number): string => {
  const today = dayKey(now);
  if (state.lastDay === null) return today;
  return dayNumber(today) < dayNumber(state.lastDay) ? state.lastDay : today;
};

interface StreakState {
  readonly streak: number;
  readonly freezes: number;
}

/**
 * Moves the streak on for an answer given on `day`. Missed days are covered by freezes when there
 * are enough of them; otherwise the streak starts again. A freeze is earned for every full week.
 */
const advanceStreak = (state: Progress, day: string): StreakState => {
  if (state.lastDay === day) return { streak: state.streak, freezes: state.freezes };
  if (state.lastDay === null) return { streak: 1, freezes: state.freezes };

  const missed = dayNumber(day) - dayNumber(state.lastDay) - 1;
  if (missed > state.freezes) return { streak: 1, freezes: state.freezes };

  const streak = state.streak + 1;
  const spare = state.freezes - missed;
  const earned = streak % FREEZE_EVERY === 0 ? 1 : 0;
  return { streak, freezes: Math.min(FREEZE_CAP, spare + earned) };
};

/** Answers given today. The stored count belongs to whichever day it was recorded on. */
export const dailyAnswered = (state: Progress, now: number): number =>
  state.daily.day === dayKey(now) ? state.daily.answered : 0;

export const recordAnswer = (
  state: Progress,
  wordId: string,
  isCorrect: boolean,
  now: number,
): Progress => {
  const prev = state.words[wordId] ?? FRESH_WORD;
  const box = isCorrect ? Math.min(prev.box + 1, MAX_BOX) : 0;
  const day = effectiveDay(state, now);
  const { streak, freezes } = advanceStreak(state, day);

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
    lastDay: day,
    daily: { day, answered: (state.daily.day === day ? state.daily.answered : 0) + 1 },
    freezes,
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

/** Due reviews first (most overdue on top), then brand-new words (easiest level first), then the rest. */
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
  // New words come from the lowest level that still has any, so learners build up in order.
  const unseen = pool.filter((w) => !state.words[w.id]);
  const fresh = LEVELS.flatMap((level) =>
    shuffle(
      unseen.filter((w) => w.level === level),
      rng,
    ),
  );
  const waiting = shuffle(
    pool.filter((w) => state.words[w.id] && state.words[w.id].due > now),
    rng,
  );
  return [...due, ...fresh, ...waiting].slice(0, count);
};
