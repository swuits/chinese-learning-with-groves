"use client";

import { useSyncExternalStore } from "react";
import { canSpeak, speak } from "@/lib/speech";

interface SpeakButtonProps {
  text: string;
  label?: string;
}

const noopSubscribe = () => () => {};

export function SpeakButton({ text, label = "Hear it" }: SpeakButtonProps) {
  const isSupported = useSyncExternalStore(noopSubscribe, canSpeak, () => false);
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        speak(text);
      }}
      className="press inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-bold"
    >
      <span aria-hidden>🔊</span>
      {label}
    </button>
  );
}
