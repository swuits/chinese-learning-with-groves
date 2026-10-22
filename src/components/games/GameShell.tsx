"use client";

import { useState, type ReactNode } from "react";
import { CategoryPicker, type CategoryChoice } from "@/components/ui/CategoryPicker";
import { LevelPicker, type LevelChoice } from "@/components/ui/LevelPicker";
import { pickSession, type Progress } from "@/lib/progress/progress";
import { useProgress } from "@/lib/progress/store";
import { CATEGORY_META, type Word } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";

const MIN_POOL = 4;

const choosePool = (level: LevelChoice, category: CategoryChoice): Word[] =>
  WORDS.filter((w) => (level === "all" || w.level === level) && (category === "all" || w.category === category));

interface Session {
  words: Word[];
  /** Progress as it stood when the round began, so the recap can show what changed. */
  before: Progress;
}

interface GameShellProps {
  title: string;
  kicker: string;
  blurb: string;
  wordCount: number;
  glyph: string;
  children: (words: Word[], restart: () => void, before: Progress) => ReactNode;
}

/** Topic picker -> game -> back to picker. Each game only renders the "play" part. */
export function GameShell({ title, kicker, blurb, wordCount, glyph, children }: GameShellProps) {
  const { progress } = useProgress();
  const [level, setLevel] = useState<LevelChoice>("all");
  const [choice, setChoice] = useState<CategoryChoice>("all");
  const [session, setSession] = useState<Session | null>(null);

  const poolSize = choosePool(level, choice).length;
  const canStart = poolSize >= MIN_POOL;
  const topicName = choice === "all" ? "Every topic" : CATEGORY_META[choice].label;

  const start = () => {
    if (!canStart) return;
    setSession({
      words: pickSession(choosePool(level, choice), progress, wordCount, Date.now()),
      before: progress,
    });
  };

  if (session) return <>{children(session.words, () => setSession(null), session.before)}</>;

  return (
    <section aria-labelledby="game-title" className="rise mx-auto max-w-2xl pt-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-[var(--shadow-lift)] sm:p-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-10 select-none font-hanzi text-[11rem] font-black leading-none text-leaf/25"
        >
          {glyph}
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-seal">{kicker}</p>
        <h1 id="game-title" className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">{blurb}</p>

        <div className="mt-8 grid gap-6">
          <div>
            <p className="mb-3 text-sm font-bold">Level</p>
            <LevelPicker value={level} onChange={setLevel} />
          </div>

          <details className="group rounded-2xl border border-line bg-paper px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
              <span>
                Topic: <span className="text-bamboo-deep">{topicName}</span>
              </span>
              <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-4">
              <CategoryPicker value={choice} onChange={setChoice} />
            </div>
          </details>
        </div>

        <p className="mt-5 text-sm text-ink-soft" aria-live="polite">
          {canStart
            ? `${poolSize.toLocaleString()} words to draw from`
            : "Too few words in that mix. Try another level or topic."}
        </p>

        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className="press mt-4 w-full rounded-2xl bg-seal px-6 py-4 font-display text-xl font-semibold text-card disabled:opacity-50 sm:w-auto"
          style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
        >
          Start · {wordCount} words →
        </button>
      </div>
    </section>
  );
}
