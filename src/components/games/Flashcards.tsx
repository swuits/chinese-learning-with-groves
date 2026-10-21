"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress/store";
import type { Word } from "@/lib/vocab/types";
import { CATEGORY_META } from "@/lib/vocab/types";
import { SpeakButton } from "./SpeakButton";
import { Summary } from "./Summary";

interface FlashcardsProps {
  words: Word[];
  onRestart: () => void;
}

export function Flashcards({ words, onRestart }: FlashcardsProps) {
  const { answer } = useProgress();
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  if (index >= words.length) {
    return <Summary correct={knownCount} total={words.length} onAgain={onRestart} />;
  }

  const word = words[index];

  const rate = (isKnown: boolean) => {
    answer(word.id, isKnown);
    if (isKnown) setKnownCount((n) => n + 1);
    setIsFlipped(false);
    setIndex((i) => i + 1);
  };

  return (
    <section aria-label="Flashcards" className="mx-auto max-w-xl pt-2">
      <ProgressBar current={index} total={words.length} />

      <div className="flip-scene mt-6">
        <div className="flip-card relative h-[22rem]" data-flipped={isFlipped}>
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            aria-hidden={isFlipped}
            tabIndex={isFlipped ? -1 : 0}
            className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-line bg-card shadow-[var(--shadow-lift)]"
          >
            <span className="rounded-full bg-paper-deep px-3 py-1 text-xs font-bold uppercase tracking-widest text-bamboo">
              {CATEGORY_META[word.category].emoji} {CATEGORY_META[word.category].label}
            </span>
            <span className="font-hanzi text-[7rem] font-black leading-none sm:text-[9rem]">{word.hanzi}</span>
            <span className="text-sm font-semibold text-ink-soft">Tap to reveal</span>
          </button>

          <div
            aria-hidden={!isFlipped}
            className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-bamboo-deep p-6 text-center text-card shadow-[var(--shadow-lift)]"
          >
            <span className="font-hanzi text-5xl font-black">{word.hanzi}</span>
            <span className="font-display text-3xl italic text-leaf">{word.pinyin}</span>
            <span className="text-2xl font-bold">{word.en}</span>
            <SpeakButton text={word.hanzi} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3" aria-live="polite">
        <button
          type="button"
          disabled={!isFlipped}
          onClick={() => rate(false)}
          className="press rounded-2xl bg-card px-4 py-4 font-display text-lg font-semibold text-seal-deep ring-2 ring-seal/40 disabled:opacity-40"
          style={{ "--press-edge": "var(--seal)" } as React.CSSProperties}
        >
          Again 🔁
        </button>
        <button
          type="button"
          disabled={!isFlipped}
          onClick={() => rate(true)}
          className="press rounded-2xl bg-bamboo px-4 py-4 font-display text-lg font-semibold text-card disabled:opacity-40"
          style={{ "--press-edge": "var(--bamboo-deep)" } as React.CSSProperties}
        >
          Got it ✓
        </button>
      </div>
    </section>
  );
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label="Round progress"
      className="h-3 overflow-hidden rounded-full bg-paper-deep"
    >
      <div
        className="h-full origin-left rounded-full bg-leaf transition-transform duration-500"
        style={{ transform: `scaleX(${total === 0 ? 0 : current / total})` }}
      />
    </div>
  );
}
