export type Category =
  | "greetings"
  | "numbers"
  | "people"
  | "food"
  | "actions"
  | "places"
  | "time"
  | "describing";

export interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  en: string;
  category: Category;
}

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  greetings: { label: "Greetings", emoji: "👋" },
  numbers: { label: "Numbers", emoji: "🔢" },
  people: { label: "People", emoji: "🧑‍🤝‍🧑" },
  food: { label: "Food & Drink", emoji: "🍜" },
  actions: { label: "Actions", emoji: "🏃" },
  places: { label: "Places", emoji: "🏯" },
  time: { label: "Time", emoji: "⏳" },
  describing: { label: "Describing", emoji: "🎨" },
};
