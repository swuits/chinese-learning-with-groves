import { z } from "zod";
import { MAX_BOX, type Progress } from "./progress";

const MAX_WORD_ID_LENGTH = 64;

const wordProgressSchema = z.object({
  box: z.number().int().min(0).max(MAX_BOX),
  seen: z.number().int().min(0),
  correct: z.number().int().min(0),
  wrong: z.number().int().min(0),
  due: z.number().finite(),
});

const progressSchema = z.object({
  words: z.record(z.string().max(MAX_WORD_ID_LENGTH), wordProgressSchema),
  xp: z.number().int().min(0),
  streak: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  lastDay: z.string().max(16).nullable(),
});

/** Anything read from localStorage or the database is untrusted until it passes this. */
export const parseProgress = (value: unknown): Progress | null => {
  const result = progressSchema.safeParse(value);
  return result.success ? result.data : null;
};
