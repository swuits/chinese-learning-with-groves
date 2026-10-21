"use client";

import Link from "next/link";
import { Grove } from "@/components/grove/Grove";
import { levelFromXp, masteredCount, wordsSeenCount } from "@/lib/progress/progress";
import { categoryStats } from "@/lib/progress/selectors";
import { useProgress } from "@/lib/progress/store";
import { CATEGORY_META, type Category } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

const MODES = [
  { href: "/learn", title: "Flashcards", note: "Flip, hear, remember", glyph: "学", tone: "bg-bamboo-deep text-card" },
  { href: "/quiz", title: "Quiz", note: "Chain a streak", glyph: "问", tone: "bg-seal text-card" },
  { href: "/match", title: "Match", note: "Beat the clock", glyph: "配", tone: "bg-gold text-ink" },
] as const;

export function HomeDashboard() {
  const { progress } = useProgress();
  const { level, into, needed } = levelFromXp(progress.xp);
  const stats = categoryStats(WORDS, progress, CATEGORIES);
  const mastered = masteredCount(progress);
  const seen = wordsSeenCount(progress);

  return (
    <div className="grid gap-10">
      <section className="grid items-end gap-6 pt-4 md:grid-cols-[1.1fr_1fr]">
        <div className="rise">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-seal">学中文 · learn Chinese</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Grow a grove,
            <br />
            <span className="italic text-bamboo">one word</span> at a time.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            {WORDS.length} essential words, three quick games. Every word you truly learn makes a stalk of bamboo
            taller.
          </p>
          <Link
            href="/quiz"
            className="press mt-7 inline-block rounded-2xl bg-seal px-7 py-4 font-display text-xl font-semibold text-card"
            style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
          >
            Practise now →
          </Link>
        </div>

        <div className="rise relative rounded-[2rem] border border-line bg-card p-5 shadow-[var(--shadow-lift)]" style={{ "--i": 2 } as React.CSSProperties}>
          <Grove stats={stats} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Tally value={mastered} label="mastered" />
            <Tally value={seen} label="met" />
            <Tally value={progress.bestStreak} label="best streak" />
          </div>
        </div>
      </section>

      <section aria-label="Level progress" className="rise rounded-2xl border border-line bg-card p-4" style={{ "--i": 3 } as React.CSSProperties}>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-xl font-semibold">Level {level}</p>
          <p className="text-sm font-semibold text-ink-soft">
            {into}/{needed} XP to Level {level + 1}
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-paper-deep">
          <div
            className="h-full origin-left rounded-full bg-leaf transition-transform duration-700"
            style={{ transform: `scaleX(${into / needed})` }}
          />
        </div>
      </section>

      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="font-display text-3xl font-semibold">
          Pick a game
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3" role="list">
          {MODES.map((mode, i) => (
            <li key={mode.href} className="rise" style={{ "--i": i + 4 } as React.CSSProperties}>
              <Link
                href={mode.href}
                className={`press group relative block h-44 overflow-hidden rounded-[1.75rem] p-5 ${mode.tone}`}
                style={{ "--press-edge": "var(--ink)" } as React.CSSProperties}
              >
                <span
                  aria-hidden
                  className="absolute -bottom-6 -right-2 font-hanzi text-[9rem] font-black leading-none opacity-20 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                >
                  {mode.glyph}
                </span>
                <span className="relative font-display text-3xl font-semibold">{mode.title}</span>
                <span className="relative mt-1 block font-semibold opacity-80">{mode.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="font-display text-3xl font-semibold">
          Your topics
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2" role="list">
          {stats.map((stat) => (
            <li key={stat.category} className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
              <span aria-hidden className="text-3xl">
                {CATEGORY_META[stat.category].emoji}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{CATEGORY_META[stat.category].label}</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className="h-full origin-left rounded-full bg-bamboo transition-transform duration-700"
                    style={{ transform: `scaleX(${stat.ratio})` }}
                  />
                </div>
              </div>
              <p className="text-sm font-bold text-ink-soft">
                {stat.mastered}/{stat.total}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tally({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-paper px-2 py-2">
      <p className="font-display text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">{label}</p>
    </div>
  );
}
