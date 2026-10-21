"use client";

import { CATEGORY_META, type Category } from "@/lib/vocab/types";

export type CategoryChoice = Category | "all";

interface CategoryPickerProps {
  value: CategoryChoice;
  onChange: (next: CategoryChoice) => void;
}

const CHOICES: readonly CategoryChoice[] = ["all", ...(Object.keys(CATEGORY_META) as Category[])];

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div role="radiogroup" aria-label="Choose a topic" className="flex flex-wrap gap-2">
      {CHOICES.map((choice) => {
        const isOn = choice === value;
        const label = choice === "all" ? "Everything" : CATEGORY_META[choice].label;
        const emoji = choice === "all" ? "🌿" : CATEGORY_META[choice].emoji;
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={isOn}
            onClick={() => onChange(choice)}
            className={`press rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold ${
              isOn ? "bg-bamboo-deep text-card" : "bg-card text-ink"
            }`}
            style={{ "--press-edge": isOn ? "var(--ink)" : "var(--line)" } as React.CSSProperties}
          >
            <span aria-hidden className="mr-1.5">
              {emoji}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
