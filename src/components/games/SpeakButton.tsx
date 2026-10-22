"use client";

import { useEffect, useRef, useState } from "react";
import { speakFallback } from "@/lib/speech";
import { audioUrl } from "@/lib/vocab/audio";
import type { Word } from "@/lib/vocab/types";

interface SpeakButtonProps {
  word: Word;
  label?: string;
}

export function SpeakButton({ word, label = "Hear it" }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const url = audioUrl(word);

  // Load the recording as soon as the word appears so the first tap is instant.
  useEffect(() => {
    const audio = new Audio(url);
    audio.preload = "auto";
    const stop = () => setIsPlaying(false);
    audio.addEventListener("ended", stop);
    audio.addEventListener("pause", stop);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("ended", stop);
      audio.removeEventListener("pause", stop);
      audio.pause();
      audioRef.current = null;
    };
  }, [url]);

  const play = async () => {
    const audio = audioRef.current;
    // Ignore taps mid-clip: restarting a sound while it plays is what makes it crackle.
    if (isPlaying) return;

    if (audio) {
      try {
        audio.currentTime = 0;
        setIsPlaying(true);
        await audio.play();
        return;
      } catch {
        setIsPlaying(false);
      }
    }
    await speakFallback(word.hanzi);
  };

  return (
    <button
      type="button"
      aria-label={`${label}: ${word.pinyin}`}
      aria-busy={isPlaying}
      onClick={(event) => {
        event.stopPropagation();
        void play();
      }}
      className={`press inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold ${
        isPlaying ? "bg-leaf text-ink" : "bg-paper"
      }`}
    >
      <span aria-hidden className={isPlaying ? "pop inline-block" : "inline-block"}>
        🔊
      </span>
      {isPlaying ? "Playing…" : label}
    </button>
  );
}
