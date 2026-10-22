"use client";

export interface VoiceLike {
  name: string;
  lang: string;
}

// Names that mark the better-sounding voices on common systems.
const QUALITY_HINTS = ["natural", "neural", "online", "xiaoxiao", "google", "siri", "tingting", "ting-ting"];

const isMandarinMainland = (lang: string): boolean => /^(zh|cmn)[-_](hans[-_])?cn$/i.test(lang) || /^cmn[-_]hans/i.test(lang);

const languageScore = (lang: string): number => {
  if (isMandarinMainland(lang)) return 30;
  if (/^(zh|cmn)([-_]|$)/i.test(lang)) return /[-_](tw|hk)$/i.test(lang) ? 10 : 20;
  return -1;
};

const qualityScore = (name: string): number => {
  const lower = name.toLowerCase();
  return QUALITY_HINTS.reduce((score, hint, i) => (lower.includes(hint) ? score + (QUALITY_HINTS.length - i) : score), 0);
};

/** Best Chinese voice available, or null. Language matters most, then how natural it sounds. */
export const pickChineseVoice = <T extends VoiceLike>(voices: readonly T[]): T | null => {
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const voice of voices) {
    const language = languageScore(voice.lang);
    if (language < 0) continue;
    const score = language * 100 + qualityScore(voice.name);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
};

const VOICES_TIMEOUT_MS = 800;
const SPEECH_RATE = 0.85;

const loadVoices = (synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    const ready = synth.getVoices();
    if (ready.length > 0) return resolve(ready);
    // Browsers fill the voice list a moment after the page loads.
    const finish = () => {
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    setTimeout(finish, VOICES_TIMEOUT_MS);
  });

export const canSpeak = (): boolean => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Backup for when a recording cannot play: reads the text with the best Chinese voice the
 * browser has. Never speaks with a non-Chinese voice, which would just garble the characters.
 */
export const speakFallback = async (text: string): Promise<void> => {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  const voice = pickChineseVoice(await loadVoices(synth));
  if (!voice) return;

  // Cancelling when nothing is playing makes some browsers pop, so only cancel real speech.
  if (synth.speaking) synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = SPEECH_RATE;
  synth.speak(utterance);
};
