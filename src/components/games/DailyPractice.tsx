"use client";

import { useState } from "react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { DAILY_GOAL, dailyAnswered, pickSession, type Progress } from "@/lib/progress/progress";
import { dueCount } from "@/lib/progress/selectors";
import { useProgress } from "@/lib/progress/store";
import { useNow } from "@/lib/useNow";
import type { Word } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";
import { Quiz } from "./Quiz";

const SESSION_SIZE = 10;

interface Session {
  words: Word[];
  before: Progress;
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

/** One tap: reviews that are due come first, then new words, as a ten-question quiz. */
export function DailyPractice() {
  const { progress } = useProgress();
  const now = useNow();
  const [session, setSession] = useState<Session | null>(null);

  if (session) {
    return <Quiz words={session.words} before={session.before} onRestart={() => setSession(null)} />;
  }

  const answered = dailyAnswered(progress, now);
  const reviews = Math.min(dueCount(WORDS, progress, now), SESSION_SIZE);
  const fresh = SESSION_SIZE - reviews;

  const start = () => {
    setSession({ words: pickSession(WORDS, progress, SESSION_SIZE, Date.now()), before: progress });
  };

  return (
    <section aria-labelledby="daily-title" className="rise mx-auto max-w-xl pt-4">
      <div className="rounded-[2rem] border border-line bg-card p-6 text-center shadow-[var(--shadow-lift)] sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-seal">Today</p>
        <h1 id="daily-title" className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Today&apos;s practice
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-ink-soft">
          {reviews > 0
            ? `${plural(reviews, "review", "reviews")} that are ready, plus ${plural(fresh, "new word", "new words")}.`
            : `Nothing is due, so here are ${plural(SESSION_SIZE, "new word", "new words")}.`}{" "}
          About two minutes.
        </p>

        <div className="mt-6 flex justify-center">
          <ProgressRing value={answered} max={DAILY_GOAL} label="Today's practice goal">
            <span>
              <span className="block font-display text-3xl font-semibold leading-none">{answered}</span>
              <span className="block text-xs font-bold text-ink-soft">of {DAILY_GOAL}</span>
            </span>
          </ProgressRing>
        </div>

        <button
          type="button"
          onClick={start}
          className="press mt-8 w-full rounded-2xl bg-seal px-6 py-4 font-display text-xl font-semibold text-card sm:w-auto"
          style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
        >
          Start · {SESSION_SIZE} words →
        </button>
      </div>
    </section>
  );
}
