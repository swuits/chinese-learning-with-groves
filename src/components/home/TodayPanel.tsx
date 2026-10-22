"use client";

import Link from "next/link";
import { DAILY_GOAL, FREEZE_CAP, dailyAnswered, wordsSeenCount } from "@/lib/progress/progress";
import { dueCount } from "@/lib/progress/selectors";
import { useProgress } from "@/lib/progress/store";
import { useNow } from "@/lib/useNow";
import { WORDS } from "@/lib/vocab/words";
import { ProgressRing } from "@/components/ui/ProgressRing";

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export function TodayPanel() {
  const { progress } = useProgress();
  const now = useNow();
  const answered = dailyAnswered(progress, now);
  const due = dueCount(WORDS, progress, now);
  const isDone = answered >= DAILY_GOAL;
  const isNewLearner = wordsSeenCount(progress) === 0;
  const streakAtRisk = progress.streak > 0 && answered === 0;

  const headline = isNewLearner
    ? "Meet your first words"
    : isDone
      ? "Goal reached. Nicely done!"
      : due > 0
        ? `${plural(due, "word is", "words are")} ready to review`
        : "You're all caught up on reviews";

  const nudge = streakAtRisk
    ? progress.freezes > 0
      ? `Practice today to keep your ${progress.streak}-day streak. A freeze 🧊 would cover one missed day.`
      : `Practice today to keep your ${progress.streak}-day streak.`
    : isDone
      ? "Keep going, or come back tomorrow to grow your streak."
      : `${plural(DAILY_GOAL - answered, "answer", "answers")} to reach today's goal.`;

  return (
    <section
      aria-labelledby="today-heading"
      className="rise flex flex-col gap-5 rounded-[2rem] border border-line bg-card p-5 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:gap-7 sm:p-6"
      style={{ "--i": 3 } as React.CSSProperties}
    >
      <ProgressRing value={answered} max={DAILY_GOAL} label="Today's practice goal">
        {isDone ? (
          <span aria-hidden className="pop text-4xl">
            ✓
          </span>
        ) : (
          <span>
            <span className="block font-display text-3xl font-semibold leading-none">{answered}</span>
            <span className="block text-xs font-bold text-ink-soft">of {DAILY_GOAL}</span>
          </span>
        )}
      </ProgressRing>

      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-seal">Today</p>
        <h2 id="today-heading" className="mt-1 font-display text-2xl font-semibold leading-tight sm:text-3xl">
          {headline}
        </h2>
        <p className="mt-1.5 text-ink-soft">{nudge}</p>

        <ul className="mt-3 flex flex-wrap gap-2 text-sm font-bold" aria-label="Streak">
          <li className="rounded-full bg-gold/35 px-3 py-1">
            🔥 {plural(progress.streak, "day", "days")}
          </li>
          <li
            className="rounded-full bg-leaf/35 px-3 py-1"
            title={`Earn a freeze for every 7 days in a row (up to ${FREEZE_CAP}). One is used automatically if you miss a day.`}
          >
            🧊 {plural(progress.freezes, "freeze", "freezes")}
          </li>
        </ul>
      </div>

      <Link
        href="/daily"
        className="press rounded-2xl bg-seal px-6 py-4 text-center font-display text-xl font-semibold text-card"
        style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
      >
        Start today&apos;s practice →
      </Link>
    </section>
  );
}
