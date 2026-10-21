"use client";

export const canSpeak = (): boolean =>
  typeof window !== "undefined" && "speechSynthesis" in window;

/** Reads Chinese text aloud with the browser's built-in voice. Silent no-op if unsupported. */
export const speak = (text: string): void => {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.8;
  synth.speak(utterance);
};
