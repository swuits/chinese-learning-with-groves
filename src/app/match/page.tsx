"use client";

import { GameShell } from "@/components/games/GameShell";
import { MatchGame } from "@/components/games/MatchGame";

export default function MatchPage() {
  return (
    <GameShell
      title="Match the pairs"
      kicker="Speed game"
      blurb="Six words, twelve tiles. Pair each character with its meaning as fast as you can, with as few slips as possible."
      wordCount={6}
      glyph="配"
    >
      {(words, restart, before) => <MatchGame words={words} before={before} onRestart={restart} />}
    </GameShell>
  );
}
