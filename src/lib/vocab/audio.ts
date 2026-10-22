import type { Word } from "./types";

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Short ASCII filename for a word's recording, so URLs never depend on Chinese characters.
 * FNV-1a over the text; the audio test asserts every word in the list gets a distinct key.
 */
export const audioKey = (hanzi: string): string => {
  let hash = FNV_OFFSET;
  for (let i = 0; i < hanzi.length; i++) {
    hash = Math.imul(hash ^ hanzi.charCodeAt(i), FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

export const audioUrl = (word: Word): string => `/audio/${audioKey(word.hanzi)}.mp3`;
