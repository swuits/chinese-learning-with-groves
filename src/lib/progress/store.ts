"use client";

import { useSyncExternalStore } from "react";
import { createProgressStore, INITIAL_STATE, type KeyValueStorage } from "./store-core";

const browserStorage = (): KeyValueStorage | null => {
  if (typeof window === "undefined") return null;
  return {
    getItem: (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Blocked or full: handled by the store, which keeps progress in memory.
      }
    },
  };
};

export const progressStore = createProgressStore({ storage: browserStorage() });

const getServerState = () => INITIAL_STATE;

export const useProgress = () => {
  const state = useSyncExternalStore(progressStore.subscribe, progressStore.getState, getServerState);
  return {
    progress: state.progress,
    status: state.status,
    answer: progressStore.answer,
    reset: progressStore.reset,
  };
};
