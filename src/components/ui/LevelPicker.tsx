"use client";

import { LEVEL_LABEL, LEVELS, type Level } from "@/lib/vocab/types";

export type LevelChoice = Level | "all";

interface LevelPickerProps {
  value: LevelChoice;
  onChange: (next: LevelChoice) => void;
}

const CHOICES: readonly LevelChoice[] = ["all", ...LEVELS];

export function LevelPicker({ value, onChange }: LevelPickerProps) {
  return (
    <div role="radiogroup" aria-label="Choose a level" className="flex flex-wrap gap-2">
      {CHOICES.map((choice) => {
        const isOn = choice === value;
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={isOn}
            onClick={() => onChange(choice)}
            className={`press rounded-full border border-line px-4 py-1.5 text-sm font-bold ${
              isOn ? "bg-seal text-card" : "bg-card text-ink"
            }`}
            style={{ "--press-edge": isOn ? "var(--seal-deep)" : "var(--line)" } as React.CSSProperties}
          >
            {choice === "all" ? "All levels" : LEVEL_LABEL[choice]}
          </button>
        );
      })}
    </div>
  );
}
