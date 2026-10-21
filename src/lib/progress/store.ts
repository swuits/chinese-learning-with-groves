"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, recordAnswer, type Progress } from "./progress";

const STORAGE_KEY = "groves:progress:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let cache: Progress | null = null;

const isProgress = (value: unknown): value is Progress => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.xp === "number" &&
    typeof v.streak === "number" &&
    typeof v.bestStreak === "number" &&
    typeof v.words === "object" &&
    v.words !== null
  );
};

const read = (): Progress => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed: unknown = JSON.parse(raw);
    return isProgress(parsed) ? parsed : EMPTY_PROGRESS;
  } catch {
    // Private mode or corrupted JSON: start fresh rather than crash the app.
    return EMPTY_PROGRESS;
  }
};

const getSnapshot = (): Progress => {
  if (cache === null) cache = read();
  return cache;
};

const getServerSnapshot = (): Progress => EMPTY_PROGRESS;

const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const commit = (next: Progress): void => {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: progress still lives in memory for this session.
  }
  listeners.forEach((listener) => listener());
};

export const useProgress = () => {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const answer = useCallback((wordId: string, isCorrect: boolean) => {
    commit(recordAnswer(getSnapshot(), wordId, isCorrect, Date.now()));
  }, []);

  const reset = useCallback(() => commit(EMPTY_PROGRESS), []);

  return { progress, answer, reset };
};
