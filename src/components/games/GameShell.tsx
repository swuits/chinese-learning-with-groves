"use client";

import { useState, type ReactNode } from "react";
import { CategoryPicker, type CategoryChoice } from "@/components/ui/CategoryPicker";
import { pickSession } from "@/lib/progress/progress";
import { useProgress } from "@/lib/progress/store";
import type { Word } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";

interface GameShellProps {
  title: string;
  kicker: string;
  blurb: string;
  wordCount: number;
  glyph: string;
  children: (words: Word[], restart: () => void) => ReactNode;
}

/** Topic picker -> game -> back to picker. Each game only renders the "play" part. */
export function GameShell({ title, kicker, blurb, wordCount, glyph, children }: GameShellProps) {
  const { progress } = useProgress();
  const [choice, setChoice] = useState<CategoryChoice>("all");
  const [words, setWords] = useState<Word[] | null>(null);

  const start = () => {
    const pool = choice === "all" ? WORDS : WORDS.filter((w) => w.category === choice);
    setWords(pickSession(pool, progress, wordCount, Date.now()));
  };

  if (words) return <>{children(words, () => setWords(null))}</>;

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

        <div className="mt-8">
          <p className="mb-3 text-sm font-bold">What do you want to practise?</p>
          <CategoryPicker value={choice} onChange={setChoice} />
        </div>

        <button
          type="button"
          onClick={start}
          className="press mt-8 w-full rounded-2xl bg-seal px-6 py-4 font-display text-xl font-semibold text-card sm:w-auto"
          style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
        >
          Start · {wordCount} words →
        </button>
      </div>
    </section>
  );
}
