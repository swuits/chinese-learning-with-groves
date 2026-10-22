"use client";

import { Grove } from "@/components/grove/Grove";
import { DAILY_GOAL, MASTERED_BOX, type Progress } from "@/lib/progress/progress";
import { levelStats, sessionGains } from "@/lib/progress/selectors";
import { useProgress } from "@/lib/progress/store";
import { LEVEL_LABEL, LEVELS } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";

interface SessionRecapProps {
  /** Progress as it stood when the round began. */
  before: Progress;
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

/** What this round did: stalks that grew, words newly mastered, today's goal and the streak. */
export function SessionRecap({ before }: SessionRecapProps) {
  const { progress } = useProgress();
  const gains = sessionGains(WORDS, before, progress);
  const stalks = levelStats(WORDS, progress, LEVELS).map((stat, i) => ({
    key: `level-${stat.level}`,
    label: LEVEL_LABEL[stat.level],
    mastered: stat.mastered,
    total: stat.total,
    ratio: stat.ratio,
    gain: gains.byLevel[i].delta,
  }));

  const answeredBefore = before.daily.day === progress.daily.day ? before.daily.answered : 0;
  const answeredNow = progress.daily.answered;
  const justReachedGoal = answeredBefore < DAILY_GOAL && answeredNow >= DAILY_GOAL;
  const streakGrew = progress.streak > before.streak;
  const freezeEarned = progress.freezes > before.freezes;
  const freezeUsed = progress.freezes < before.freezes;
  const masteredCount = gains.newlyMastered.length;

  return (
    <div className="mt-6 grid gap-4 text-left">
      <section aria-label="Your grove" className="rounded-2xl bg-paper px-4 pb-3 pt-4">
        <p className="text-center text-sm font-bold">
          {masteredCount > 0
            ? `${plural(masteredCount, "word", "words")} mastered. Your grove grew!`
            : "Your grove"}
        </p>
        <div className="mx-auto mt-1 max-w-xs">
          <Grove stalks={stalks} />
        </div>
        {masteredCount > 0 ? (
          <ul className="mt-1 flex flex-wrap justify-center gap-2" aria-label="Newly mastered words">
            {gains.newlyMastered.map((word) => (
              <li key={word.id} className="pop rounded-full bg-leaf/40 px-3 py-1 text-sm font-semibold">
                <span className="font-hanzi font-bold">{word.hanzi}</span> {word.en}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-center text-xs text-ink-soft">
            A word is mastered once you get it right {MASTERED_BOX} times in a row. Stalks grow as words are
            mastered.
          </p>
        )}
      </section>

      <ul className="grid gap-2 text-sm font-semibold sm:grid-cols-2" aria-label="This round">
        {gains.newlyMet > 0 && (
          <li className="rounded-xl bg-paper px-4 py-2.5">🌱 {plural(gains.newlyMet, "new word", "new words")} met</li>
        )}
        <li className="rounded-xl bg-paper px-4 py-2.5">
          {justReachedGoal ? "🎉" : "📅"} {Math.min(answeredNow, DAILY_GOAL)} of {DAILY_GOAL} today
          {justReachedGoal ? " · goal reached!" : ""}
        </li>
        <li className="rounded-xl bg-paper px-4 py-2.5">
          🔥 {plural(progress.streak, "day", "days")} in a row{streakGrew ? " · +1" : ""}
        </li>
        {freezeEarned && (
          <li className="pop rounded-xl bg-leaf/35 px-4 py-2.5">🧊 You earned a streak freeze!</li>
        )}
        {freezeUsed && (
          <li className="rounded-xl bg-gold/35 px-4 py-2.5">🧊 A freeze covered a missed day and saved your streak.</li>
        )}
      </ul>
    </div>
  );
}
