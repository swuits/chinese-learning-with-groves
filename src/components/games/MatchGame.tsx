"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildMatchRound, type MatchTile } from "@/lib/quiz";
import { useProgress } from "@/lib/progress/store";
import type { Word } from "@/lib/vocab/types";
import { Summary } from "./Summary";

interface MatchGameProps {
  words: Word[];
  onRestart: () => void;
}

const MISMATCH_DELAY_MS = 750;

export function MatchGame({ words, onRestart }: MatchGameProps) {
  const { answer } = useProgress();
  const tiles = useMemo(() => buildMatchRound(words), [words]);

  const [selected, setSelected] = useState<MatchTile | null>(null);
  const [wrongKeys, setWrongKeys] = useState<readonly string[]>([]);
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [slipped, setSlipped] = useState<ReadonlySet<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDone = matched.size === words.length;

  useEffect(() => {
    if (isDone) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isDone]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pick = (tile: MatchTile) => {
    if (wrongKeys.length > 0 || matched.has(tile.pairId) || selected?.key === tile.key) return;
    if (!selected || selected.side === tile.side) {
      setSelected(tile);
      return;
    }

    setMoves((m) => m + 1);
    if (selected.pairId === tile.pairId) {
      // Clean first-try matches count as correct; ones that needed retries count as a slip.
      answer(tile.pairId, !slipped.has(tile.pairId));
      setMatched((prev) => new Set(prev).add(tile.pairId));
      setSelected(null);
      return;
    }

    setSlipped((prev) => new Set(prev).add(selected.pairId).add(tile.pairId));
    setWrongKeys([selected.key, tile.key]);
    timer.current = setTimeout(() => {
      setWrongKeys([]);
      setSelected(null);
    }, MISMATCH_DELAY_MS);
  };

  if (isDone) {
    const clean = words.filter((w) => !slipped.has(w.id)).length;
    return (
      <Summary
        correct={clean}
        total={words.length}
        onAgain={onRestart}
        extra={`${moves} moves · ${seconds}s`}
      />
    );
  }

  return (
    <section aria-label="Matching game" className="mx-auto max-w-2xl pt-2">
      <div className="flex items-center justify-between font-bold">
        <p>
          Matched {matched.size}/{words.length}
        </p>
        <p className="text-ink-soft" aria-live="off">
          ⏱ {seconds}s · {moves} moves
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Pair each Chinese word with its meaning.</p>

      <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4" role="list">
        {tiles.map((tile, i) => {
          const isMatched = matched.has(tile.pairId);
          const isSelected = selected?.key === tile.key;
          const isWrong = wrongKeys.includes(tile.key);
          const tone = isMatched
            ? "bg-leaf/60 text-ink-soft opacity-60"
            : isWrong
              ? "bg-seal text-card shake"
              : isSelected
                ? "bg-bamboo-deep text-card"
                : "bg-card";
          return (
            <li key={tile.key} className="rise" style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                disabled={isMatched}
                aria-pressed={isSelected}
                onClick={() => pick(tile)}
                className={`press grid h-24 w-full place-items-center rounded-2xl border border-line p-2 text-center leading-tight ${tone} ${
                  tile.side === "hanzi" ? "font-hanzi text-3xl font-black" : "text-base font-semibold"
                }`}
              >
                {tile.label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
