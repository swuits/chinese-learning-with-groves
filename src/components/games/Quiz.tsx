"use client";

import { useEffect, useMemo, useState } from "react";
import { buildChoiceQuestion, type QuizMode } from "@/lib/quiz";
import type { Progress } from "@/lib/progress/progress";
import { useProgress } from "@/lib/progress/store";
import type { Word } from "@/lib/vocab/types";
import { WORDS } from "@/lib/vocab/words";
import { ProgressBar } from "./Flashcards";
import { SpeakButton } from "./SpeakButton";
import { Summary } from "./Summary";

interface QuizProps {
  words: Word[];
  before: Progress;
  onRestart: () => void;
}

const MODES: readonly QuizMode[] = ["hanzi-to-en", "en-to-hanzi", "pinyin-to-en"];

const MODE_LABEL: Record<QuizMode, string> = {
  "hanzi-to-en": "What does this mean?",
  "en-to-hanzi": "Which one is this?",
  "pinyin-to-en": "What does this sound mean?",
};

export function Quiz({ words, before, onRestart }: QuizProps) {
  const { answer } = useProgress();
  const questions = useMemo(
    () => words.map((word, i) => buildChoiceQuestion(WORDS, word, MODES[i % MODES.length])),
    [words],
  );

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const question = questions[index];
  const isDone = index >= questions.length;
  const hasAnswered = picked !== null;

  const choose = (optionId: string) => {
    if (hasAnswered || !question) return;
    const isCorrect = optionId === question.answerId;
    setPicked(optionId);
    answer(question.answerId, isCorrect);
    setScore((s) => s + (isCorrect ? 1 : 0));
    setCombo((c) => (isCorrect ? c + 1 : 0));
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  // Keyboard: 1-4 picks an answer, Enter moves on.
  useEffect(() => {
    if (isDone) return;
    const onKey = (event: KeyboardEvent) => {
      if (hasAnswered && event.key === "Enter") return next();
      const slot = Number(event.key) - 1;
      if (!hasAnswered && question && slot >= 0 && slot < question.options.length) {
        choose(question.options[slot].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, hasAnswered, question]);

  if (isDone) return <Summary before={before} correct={score} total={questions.length} onAgain={onRestart} />;

  const answerWord = words[index];
  const isWrong = hasAnswered && picked !== question.answerId;

  return (
    <section aria-label="Quiz" className="mx-auto max-w-xl pt-2">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <ProgressBar current={index} total={questions.length} />
        </div>
        <p className="relative min-w-16 text-right font-bold" aria-live="polite">
          {combo >= 2 ? (
            <span key={combo} className="pop inline-block text-seal">
              🔥 ×{combo}
            </span>
          ) : (
            <span className="text-ink-soft">
              {index + 1}/{questions.length}
            </span>
          )}
        </p>
      </div>

      <div
        key={index}
        className={`rise mt-6 rounded-[2rem] border border-line bg-card p-6 text-center shadow-[var(--shadow-lift)] sm:p-8 ${
          isWrong ? "shake" : ""
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-seal">{MODE_LABEL[question.mode]}</p>
        <p
          className={`mt-4 leading-tight ${
            question.mode === "hanzi-to-en"
              ? "font-hanzi text-[6rem] font-black"
              : "font-display text-5xl font-semibold italic"
          }`}
        >
          {question.prompt}
        </p>
        {hasAnswered && (
          <div className="rise mt-4 flex flex-col items-center gap-3">
            <p className="text-lg">
              <span className="font-hanzi font-bold">{answerWord.hanzi}</span> ·{" "}
              <span className="font-display italic text-bamboo">{answerWord.pinyin}</span> · {answerWord.en}
            </p>
            <SpeakButton word={answerWord} />
          </div>
        )}
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" role="list">
        {question.options.map((option, i) => {
          const isAnswer = option.id === question.answerId;
          const isPicked = option.id === picked;
          const tone = !hasAnswered
            ? "bg-card"
            : isAnswer
              ? "bg-leaf text-ink"
              : isPicked
                ? "bg-seal text-card"
                : "bg-card opacity-50";
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={hasAnswered}
                onClick={() => choose(option.id)}
                className={`press flex w-full items-center gap-3 rounded-2xl border border-line px-4 py-4 text-left text-lg font-semibold ${tone} ${
                  question.mode === "en-to-hanzi" ? "font-hanzi text-2xl" : ""
                } ${hasAnswered && isAnswer ? "pop" : ""}`}
              >
                <kbd className="grid size-7 shrink-0 place-items-center rounded-lg bg-paper-deep font-sans text-sm text-ink-soft">
                  {i + 1}
                </kbd>
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      {hasAnswered && (
        <button
          type="button"
          onClick={next}
          className="press rise mt-6 w-full rounded-2xl bg-bamboo-deep px-6 py-4 font-display text-xl font-semibold text-card"
          style={{ "--press-edge": "var(--ink)" } as React.CSSProperties}
        >
          {index + 1 === questions.length ? "See results" : "Next"} →
        </button>
      )}
    </section>
  );
}
