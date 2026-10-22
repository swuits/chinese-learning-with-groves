// Words the voice delivers wrongly when it just reads the character followed by a full stop.
// Each override changes what is sent to the voice; add entries when you hear a wrong word, then
// run `npm run audio -- --only=<word>` to re-record just that one.
//
// A value is either
//   - a string: the exact text to speak, or
//   - { phrase, word }: speak the phrase, then keep only the audio of `word` (see
//     scripts/cut-from-phrase.py). Neutral-tone particles and words with several readings sound
//     right inside a phrase, because the voice picks the reading that fits the sentence.
export const SPOKEN_AS = {
  // Spoken alone, the voice picks the wrong reading. These look-alike characters have only one
  // reading, and it is the one we want (checked: the recording of the look-alike matched the
  // intended tone, the original did not).
  "还": "孩。", // 孩
  "为": "未。", // 未
  "只": "纸。", // 纸
  "种": "肿。", // 肿

  // Read correctly, but the voice gives the bare word a wrong-sounding pitch contour (for example
  // 太 rising like a second tone). A different closing mark gives the tone its proper shape.
  "些": "些！",
  "伞": "伞…",
  "卖": "卖！",
  "厚": "厚！",
  "口": "口！",
  "哪": "哪",
  "喝": "喝；",
  "太": "太！",
  "差": "差！",
  "扔": "扔！",
  "棵": "棵…",
  "爱": "爱！",
  "给": "给；",
  "而": "而！",
  "脱": "脱！",
  "药": "药！",
  "要": "要！",
  "那": "那，",
  "饿": "饿！",

  // Neutral-tone particles and a two-reading word, recorded inside a phrase.
  "得": { phrase: "他跑得很快", word: "得" },
  "地": { phrase: "他慢慢地走", word: "地" },
  "过": { phrase: "我去过北京", word: "过" },
  "了": { phrase: "我吃了饭", word: "了" },
  "大夫": { phrase: "我去看大夫", word: "大夫" },
};
