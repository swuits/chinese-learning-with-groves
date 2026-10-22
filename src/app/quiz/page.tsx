"use client";

import { GameShell } from "@/components/games/GameShell";
import { Quiz } from "@/components/games/Quiz";

export default function QuizPage() {
  return (
    <GameShell
      title="Quick quiz"
      kicker="Multiple choice"
      blurb="Ten questions that mix characters, sounds and meanings. Chain correct answers for a streak. Use keys 1–4 to answer."
      wordCount={10}
      glyph="问"
    >
      {(words, restart, before) => <Quiz words={words} before={before} onRestart={restart} />}
    </GameShell>
  );
}
