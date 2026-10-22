import { mergeProgress, sameProgress } from "./merge";
import { EMPTY_PROGRESS, recordAnswer, type Progress } from "./progress";
import { parseProgress } from "./schema";

export type SyncStatus = "idle" | "saving" | "saved" | "error";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RemoteProgress {
  load(): Promise<Progress | null>;
  save(progress: Progress): Promise<void>;
}

export interface ProgressState {
  readonly progress: Progress;
  readonly status: SyncStatus;
  readonly userId: string | null;
}

export interface ProgressStoreOptions {
  storage: KeyValueStorage | null;
  saveDelayMs?: number;
  now?: () => number;
}

const STORAGE_PREFIX = "groves:progress:v2:";
const GUEST_KEY = "guest";
const DEFAULT_SAVE_DELAY_MS = 1500;

export const INITIAL_STATE: ProgressState = {
  progress: EMPTY_PROGRESS,
  status: "idle",
  userId: null,
};

/**
 * Progress lives on the device first (instant, works offline) and is mirrored to the cloud
 * for signed-in learners. Each account has its own local slot, so people sharing a browser
 * never see each other's words.
 */
export const createProgressStore = ({
  storage,
  saveDelayMs = DEFAULT_SAVE_DELAY_MS,
  now = Date.now,
}: ProgressStoreOptions) => {
  let state: ProgressState = INITIAL_STATE;
  const listeners = new Set<() => void>();

  let remote: RemoteProgress | null = null;
  let hasLoadedRemote = false;
  let isDirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let bindToken = 0;
  let queue: Promise<void> = Promise.resolve();

  const setState = (patch: Partial<ProgressState>): void => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const storageKey = (userId: string | null): string => `${STORAGE_PREFIX}${userId ?? GUEST_KEY}`;

  const readLocal = (userId: string | null): Progress => {
    try {
      const raw = storage?.getItem(storageKey(userId));
      return (raw ? parseProgress(JSON.parse(raw)) : null) ?? EMPTY_PROGRESS;
    } catch {
      // Corrupted JSON or blocked storage: start fresh rather than crash the app.
      return EMPTY_PROGRESS;
    }
  };

  const writeLocal = (userId: string | null, progress: Progress): void => {
    try {
      storage?.setItem(storageKey(userId), JSON.stringify(progress));
    } catch {
      // Storage full or blocked: progress still lives in memory for this session.
    }
  };

  const setProgress = (progress: Progress): void => {
    writeLocal(state.userId, progress);
    setState({ progress });
  };

  const clearTimer = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  /** Reads the cloud copy and folds it into what is on this device. Returns the cloud copy. */
  const pull = async (target: RemoteProgress, token: number): Promise<Progress | null | undefined> => {
    const cloud = parseProgress(await target.load());
    if (token !== bindToken) return undefined;
    if (cloud) setProgress(mergeProgress(state.progress, cloud));
    hasLoadedRemote = true;
    return cloud;
  };

  const persist = async (): Promise<void> => {
    clearTimer();
    const target = remote;
    if (!target || !isDirty) return;
    const token = bindToken;

    try {
      // Never save over a cloud copy we have not read: merge first, then write.
      if (!hasLoadedRemote && (await pull(target, token)) === undefined) return;
      const snapshot = state.progress;
      isDirty = false;
      await target.save(snapshot);
      if (token !== bindToken) return;
      setState({ status: isDirty ? "saving" : "saved" });
    } catch {
      if (token !== bindToken) return;
      isDirty = true;
      setState({ status: "error" });
    }
  };

  const enqueuePersist = (): Promise<void> => {
    queue = queue.then(persist);
    return queue;
  };

  const markDirty = (): void => {
    if (!remote) return;
    isDirty = true;
    setState({ status: "saving" });
    clearTimer();
    timer = setTimeout(() => void enqueuePersist(), saveDelayMs);
  };

  const answer = (wordId: string, isCorrect: boolean): void => {
    setProgress(recordAnswer(state.progress, wordId, isCorrect, now()));
    markDirty();
  };

  const reset = (): void => {
    setProgress(EMPTY_PROGRESS);
    markDirty();
  };

  /** Switches to a learner (or to nobody) and, when a cloud copy exists, syncs with it. */
  const bindUser = async (userId: string | null, nextRemote: RemoteProgress | null): Promise<void> => {
    bindToken += 1;
    const token = bindToken;
    clearTimer();
    isDirty = false;
    hasLoadedRemote = false;
    remote = nextRemote;
    state = { progress: readLocal(userId), status: "idle", userId };
    listeners.forEach((listener) => listener());

    if (!nextRemote) return;

    try {
      const cloud = await pull(nextRemote, token);
      if (cloud === undefined) return;
      if (cloud && sameProgress(cloud, state.progress)) {
        setState({ status: "saved" });
        return;
      }
      isDirty = true;
      setState({ status: "saving" });
      await enqueuePersist();
    } catch {
      if (token === bindToken) setState({ status: "error" });
    }
  };

  const flush = (): Promise<void> => enqueuePersist();

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getState: (): ProgressState => state, subscribe, answer, reset, bindUser, flush };
};

export type ProgressStore = ReturnType<typeof createProgressStore>;
