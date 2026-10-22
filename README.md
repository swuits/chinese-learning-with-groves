# Chinese Learning with Groves 🎋

Practice the Chinese words that matter most with flashcards, quizzes and a matching game.
Every word you master makes a stalk of bamboo in your grove grow taller.

- **100 essential words** across 8 topics (greetings, numbers, people, food, actions, places, time, describing)
- **Three games**: flip-card flashcards with spoken audio, a multiple-choice quiz with streak combos, and a timed pair-matching game
- **Spaced repetition** (Leitner boxes): words you miss come back sooner, words you know come back later
- **XP, levels and daily streaks**
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

## Word audio

Every word has a recording in `public/audio/` (neural Mandarin voice `zh-CN-XiaoxiaoNeural`, trimmed,
loudness-matched and faded at the edges so playback never clicks). Filenames come from
`audioKey()` in `src/lib/vocab/audio.ts`, and a test fails if any word is missing its file.

After adding words, regenerate only the new ones:

```bash
pip install edge-tts      # plus ffmpeg on your PATH
npm run audio             # add --force to re-record everything
```

If a recording ever fails to load, the button falls back to the browser's best Chinese voice.

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
    ├── vocab/         word list and types
    ├── progress/      spaced-repetition logic, merge, sync store, cloud adapter
    ├── auth/          sign-up/login validation and safe redirect paths
    ├── supabase/      browser, server and proxy clients
    └── quiz.ts        question and match-round builders
```
