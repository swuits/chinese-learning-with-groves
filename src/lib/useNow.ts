"use client";

import { useSyncExternalStore } from "react";

const ONE_MINUTE_MS = 60_000;

// Next.js pre-renders pages, so the time must never be read while rendering on the server. The
// clock is 0 there (and while hydrating) and holds the real time in the browser, refreshed
// every minute while anything is watching it.
let current = typeof window === "undefined" ? 0 : Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const tick = (): void => {
  current = Date.now();
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (timer === null) {
    tick();
    timer = setInterval(tick, ONE_MINUTE_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
};

const getSnapshot = (): number => current;
const getServerSnapshot = (): number => 0;

/** The current time in milliseconds, or 0 before the browser has taken over. */
export const useNow = (): number => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
