import { shuffle } from "@/lib/shuffle";
import { areConfusable } from "@/lib/vocab/synonyms";
import type { Word } from "@/lib/vocab/types";

export { shuffle };

export type QuizMode = "hanzi-to-en" | "en-to-hanzi" | "pinyin-to-en";

export interface Option {
  id: string;
  label: string;
}

export interface ChoiceQuestion {
  mode: QuizMode;
  prompt: string;
  /** Small line shown under the prompt, e.g. pinyin for a hanzi prompt. */
  hint: string | null;
  options: Option[];
  answerId: string;
}

export interface MatchTile {
  key: string;
  pairId: string;
  side: "hanzi" | "en";
  label: string;
}

const OPTION_COUNT = 4;

const promptFor = (word: Word, mode: QuizMode): { prompt: string; hint: string | null } => {
  switch (mode) {
    case "hanzi-to-en":
      return { prompt: word.hanzi, hint: null };
    case "pinyin-to-en":
      return { prompt: word.pinyin, hint: null };
    case "en-to-hanzi":
      return { prompt: word.en, hint: null };
  }
};

const labelFor = (word: Word, mode: QuizMode): string =>
  mode === "en-to-hanzi" ? word.hanzi : word.en;

/** Distractors come from the same category first so the choices feel fair, not random. */
export const buildChoiceQuestion = (
  pool: readonly Word[],
  target: Word,
  mode: QuizMode,
  rng: () => number = Math.random,
): ChoiceQuestion => {
  const answerLabel = labelFor(target, mode);
  // A fair question has exactly one right answer: no same-sounding words when the prompt is
  // pinyin, and no near-synonyms of the answer.
  const others = pool.filter(
    (w) =>
      w.id !== target.id &&
      labelFor(w, mode) !== answerLabel &&
      !areConfusable(w.hanzi, target.hanzi) &&
      !(mode === "pinyin-to-en" && w.pinyin === target.pinyin),
  );
  const sameCategory = shuffle(
    others.filter((w) => w.category === target.category),
    rng,
  );
  const elsewhere = shuffle(
    others.filter((w) => w.category !== target.category),
    rng,
  );

  const seenLabels = new Set<string>([answerLabel]);
  const distractors: Word[] = [];
  for (const candidate of [...sameCategory, ...elsewhere]) {
    if (distractors.length >= OPTION_COUNT - 1) break;
    const label = labelFor(candidate, mode);
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    distractors.push(candidate);
  }

  const options = shuffle([target, ...distractors], rng).map((w) => ({
    id: w.id,
    label: labelFor(w, mode),
  }));

  return { mode, ...promptFor(target, mode), options, answerId: target.id };
};

export const buildMatchRound = (
  words: readonly Word[],
  rng: () => number = Math.random,
): MatchTile[] =>
  shuffle(
    words.flatMap((w): MatchTile[] => [
      { key: `${w.id}:hanzi`, pairId: w.id, side: "hanzi", label: w.hanzi },
      { key: `${w.id}:en`, pairId: w.id, side: "en", label: w.en },
    ]),
    rng,
  );
