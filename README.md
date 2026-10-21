# Chinese Learning with Groves 🎋

Practise the Chinese words that matter most with flashcards, quizzes and a matching game.
Every word you master makes a stalk of bamboo in your grove grow taller.

- **100 essential words** across 8 topics (greetings, numbers, people, food, actions, places, time, describing)
- **Three games**: flip-card flashcards with spoken audio, a multiple-choice quiz with streak combos, and a timed pair-matching game
- **Spaced repetition** (Leitner boxes): words you miss come back sooner, words you know come back later
- **XP, levels and daily streaks**

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Vitest · Playwright

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright)
```

## Project layout

```
src/
├── app/               routes: /, /learn, /quiz, /match
├── components/        games, grove visual, layout, ui
└── lib/
    ├── vocab/         word list and types
    ├── progress/      spaced-repetition logic, selectors, local store
    └── quiz.ts        question and match-round builders
```
