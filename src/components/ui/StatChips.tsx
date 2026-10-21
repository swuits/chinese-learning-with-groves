"use client";

import { levelFromXp } from "@/lib/progress/progress";
import { useProgress } from "@/lib/progress/store";

export function StatChips() {
  const { progress } = useProgress();
  const { level } = levelFromXp(progress.xp);

  return (
    <ul className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold" aria-label="Your stats">
      <li
        className="flex items-center gap-1 rounded-full bg-gold/35 px-2.5 py-1"
        title={`${progress.streak} day streak`}
      >
        <span aria-hidden>🔥</span>
        <span>{progress.streak}</span>
        <span className="sr-only">day streak</span>
      </li>
      <li className="flex items-center gap-1 rounded-full bg-leaf/35 px-2.5 py-1" title="Level">
        <span aria-hidden>🎋</span>
        <span>
          <span className="hidden sm:inline">Lv </span>
          {level}
        </span>
      </li>
    </ul>
  );
}
