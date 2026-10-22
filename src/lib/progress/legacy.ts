import { pickWord } from "./merge";
import type { Progress, WordProgress } from "./progress";

// The first 100 words were saved as "<topic>-<hanzi>". Words are now saved by hanzi alone.
const LEGACY_PREFIX = /^(?:greetings|numbers|people|food|actions|places|time|describing)-/;

/** Renames old ids so progress made before the word list grew still counts. */
export const migrateLegacyIds = (progress: Progress): Progress => {
  const ids = Object.keys(progress.words);
  if (!ids.some((id) => LEGACY_PREFIX.test(id))) return progress;

  const words: Record<string, WordProgress> = {};
  for (const id of ids) {
    const next = id.replace(LEGACY_PREFIX, "");
    const entry = progress.words[id];
    const existing = words[next];
    words[next] = existing ? pickWord(existing, entry) : entry;
  }
  return { ...progress, words };
};
