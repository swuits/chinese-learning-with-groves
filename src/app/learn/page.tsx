"use client";

import { Flashcards } from "@/components/games/Flashcards";
import { GameShell } from "@/components/games/GameShell";

export default function LearnPage() {
  return (
    <GameShell
      title="Flip the cards"
      kicker="Flashcards"
      blurb="See a word, say it out loud, flip to check. Be honest with yourself: the words you miss come back sooner."
      wordCount={10}
      glyph="学"
    >
      {(words, restart, before) => <Flashcards words={words} before={before} onRestart={restart} />}
    </GameShell>
  );
}
