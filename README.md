# Chinese Learning with Groves 🎋

Practice the Chinese words that matter most with flashcards, quizzes and a matching game.
Every word you master makes a stalk of bamboo in your grove grow taller.

- **1,197 words, HSK 1 to 4**, each with pinyin, a short English meaning, a level and one of 19 topics. Pick a level, a topic, or everything; new words arrive easiest level first
- **Three games**: flip-card flashcards with spoken audio, a multiple-choice quiz with streak combos, and a timed pair-matching game
- **Spaced repetition** (Leitner boxes): words you miss come back sooner, words you know come back later
- **A daily loop**: a goal ring (20 answers a day), a "words ready to review" count, and a one-tap *Today's practice* session that puts due reviews first, then new words
- **Streak freezes**: earn one for every 7 days in a row (up to 2); one is spent automatically to cover a missed day
- **A recap after every round**: stalks grow with a "+N" badge, newly mastered words are listed, and goal and streak progress show
- **XP and levels**
- **Accounts** (Supabase Auth, email + password): games need an account, and progress syncs across devices

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres) · Vitest · Playwright

## Develop

Create `.env.local` with your Supabase project's public values (both are safe for the browser):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright), signs up throwaway accounts
E2E_BASE_URL=https://your-site.vercel.app npm run test:e2e   # same tests against a deployment
```

The e2e tests create accounts named `groves-e2e-*@example.com`. Remove them afterwards with
`delete from auth.users where email like 'groves-e2e-%@example.com'` (progress rows cascade).

## Word list

Words live in `src/lib/vocab/lists/` (`hsk1.ts` to `hsk4b.ts`) as `[hanzi, pinyin, English, topic]` rows. The
membership of each level comes from the MIT-licensed
[complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) list (old HSK 1 to 4); the pinyin,
meanings and topics are written by hand, because the dataset's first dictionary entry is often the wrong sense
(it lists 都 as "surname Du"). Tests keep every English meaning distinct, every topic non-empty, and every word
supplied with audio. `src/lib/vocab/synonyms.ts` lists near-synonyms (大概 / 大约) that a quiz must never offer
side by side.

## Word audio

Every word has a recording in `public/audio/` (neural Mandarin voice `zh-CN-XiaoyiNeural`, trimmed, peak-matched,
with tiny fades so playback never clicks). Filenames come from `audioKey()` in `src/lib/vocab/audio.ts`.

```bash
pip install edge-tts      # plus ffmpeg on your PATH
npm run audio             # records any word that has no file yet
npm run audio -- --force  # re-record everything
npm run audio -- --only=还,为   # re-record specific words
```

Set `EDGE_TTS_BIN` and `EDGE_TTS_PYTHON` if `edge-tts` is not on your PATH.

The voice reads some words wrongly on its own. Fixes live in `scripts/spoken-as.mjs`: a replacement text, or a
phrase to record the word inside (`scripts/cut-from-phrase.py` cuts the word out using the service's word
timings). Found so far: 还 (read as *huán*), 为 (*wéi*), 只 (*zhī*), 种 (*zhòng*), the particles 得 / 地 / 过 / 了,
and 大夫. If a word sounds wrong, add an entry and re-record it.

If a recording fails to load, the button falls back to the browser's best Chinese voice.

## How accounts and sync work

- `src/proxy.ts` refreshes the Supabase session on every request and sends signed-out visitors
  from `/learn`, `/quiz` and `/match` to `/login`.
- Progress is saved on the device first, in a per-account slot, then mirrored to the `progress`
  table (one row per user, locked down with row-level security). Device and cloud copies are
  merged, never overwritten.
- Schema lives in `supabase/migrations/`. Apply with `supabase db push`.
- Auth settings live in `supabase/config.toml`. `supabase config push` applies them
  **immediately with no confirmation or dry-run**, so keep that file identical to the remote
  except for the values you mean to change.

## Project layout

```
src/
├── app/               routes: /, /learn, /quiz, /match
├── components/        games, grove visual, layout, ui
└── lib/
    ├── vocab/         word lists (by HSK level), types, audio keys, synonym groups
    ├── progress/      spaced-repetition logic, merge, sync store, cloud adapter
    ├── auth/          sign-up/login validation and safe redirect paths
    ├── supabase/      browser, server and proxy clients
    └── quiz.ts        question and match-round builders
```
