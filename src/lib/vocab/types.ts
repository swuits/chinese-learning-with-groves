export type Category =
  | "greetings"
  | "numbers"
  | "people"
  | "food"
  | "actions"
  | "places"
  | "time"
  | "describing"
  | "nature"
  | "body"
  | "school"
  | "work"
  | "travel"
  | "shopping"
  | "feelings"
  | "grammar"
  | "home"
  | "tech"
  | "society";

/** HSK level the word is taught at: 1 is the first steps, 4 is comfortable everyday Chinese. */
export type Level = 1 | 2 | 3 | 4;

export interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  en: string;
  category: Category;
  level: Level;
}

/** One line of a word list file: [hanzi, pinyin, English, topic]. The level comes from the file. */
export type WordRow = readonly [hanzi: string, pinyin: string, en: string, category: Category];

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  greetings: { label: "Greetings", emoji: "👋" },
  numbers: { label: "Numbers & measure words", emoji: "🔢" },
  people: { label: "People & family", emoji: "🧑‍🤝‍🧑" },
  food: { label: "Food & drink", emoji: "🍜" },
  actions: { label: "Everyday actions", emoji: "🏃" },
  places: { label: "Places & directions", emoji: "🏯" },
  time: { label: "Time & dates", emoji: "⏳" },
  describing: { label: "Describing things", emoji: "🎨" },
  nature: { label: "Nature & weather", emoji: "🌦️" },
  body: { label: "Body & health", emoji: "💪" },
  school: { label: "School & learning", emoji: "📚" },
  work: { label: "Work & business", emoji: "💼" },
  travel: { label: "Travel & transport", emoji: "🚆" },
  shopping: { label: "Shopping & money", emoji: "🛍️" },
  feelings: { label: "Feelings & opinions", emoji: "💭" },
  grammar: { label: "Grammar words", emoji: "🧩" },
  home: { label: "Home & objects", emoji: "🏠" },
  tech: { label: "Tech & media", emoji: "📱" },
  society: { label: "Society & ideas", emoji: "🌏" },
};

export const LEVELS: readonly Level[] = [1, 2, 3, 4];

export const LEVEL_LABEL: Record<Level, string> = {
  1: "HSK 1",
  2: "HSK 2",
  3: "HSK 3",
  4: "HSK 4",
};
