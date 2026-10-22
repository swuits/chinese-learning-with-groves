import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PROGRESS, recordAnswer, type Progress } from "@/lib/progress/progress";
import {
  createProgressStore,
  type KeyValueStorage,
  type RemoteProgress,
} from "@/lib/progress/store-core";

const SAVE_DELAY = 1000;
const T0 = new Date("2026-03-10T12:00:00").getTime();

const memoryStorage = (): KeyValueStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
};

const fakeRemote = (initial: Progress | null = null) => {
  const state = { stored: initial, saves: 0, loadError: false, saveError: false };
  const remote: RemoteProgress = {
    load: async () => {
      if (state.loadError) throw new Error("offline");
      return state.stored;
    },
    save: async (progress) => {
      if (state.saveError) throw new Error("offline");
      state.saves += 1;
      state.stored = progress;
    },
  };
  return { remote, state };
};

const makeStore = (storage = memoryStorage()) =>
  createProgressStore({ storage, saveDelayMs: SAVE_DELAY, now: () => T0 });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("local persistence", () => {
  it("records answers and remembers them in storage", () => {
    const storage = memoryStorage();
    const store = makeStore(storage);
    store.answer("w1", true);
    expect(store.getState().progress.words.w1.correct).toBe(1);
    expect(storage.data.size).toBe(1);
  });

  it("restores saved progress in a new store", async () => {
    const storage = memoryStorage();
    const first = makeStore(storage);
    await first.bindUser("user-a", null);
    first.answer("w1", true);

    const second = makeStore(storage);
    await second.bindUser("user-a", null);
    expect(second.getState().progress.words.w1.correct).toBe(1);
  });

  it("ignores corrupted stored data instead of crashing", async () => {
    const storage = memoryStorage();
    storage.setItem("groves:progress:v2:user-a", "{not json");
    const store = makeStore(storage);
    await store.bindUser("user-a", null);
    expect(store.getState().progress).toEqual(EMPTY_PROGRESS);
  });

  it("notifies subscribers when progress changes", () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.answer("w1", true);
    expect(listener).toHaveBeenCalled();
  });
});

describe("accounts never see each other's progress", () => {
  it("starts a different user from scratch and restores the first when they return", async () => {
    const store = makeStore();
    await store.bindUser("user-a", null);
    store.answer("w1", true);

    await store.bindUser("user-b", null);
    expect(store.getState().progress).toEqual(EMPTY_PROGRESS);

    await store.bindUser("user-a", null);
    expect(store.getState().progress.words.w1.correct).toBe(1);
  });

  it("clears progress from memory on sign-out", async () => {
    const store = makeStore();
    await store.bindUser("user-a", null);
    store.answer("w1", true);
    await store.bindUser(null, null);
    expect(store.getState().progress).toEqual(EMPTY_PROGRESS);
    expect(store.getState().userId).toBeNull();
  });
});

describe("cloud sync", () => {
  it("merges cloud and device progress on sign-in and pushes the result up", async () => {
    const storage = memoryStorage();
    const cloud = fakeRemote(recordAnswer(EMPTY_PROGRESS, "cloud-word", true, T0));

    const store = makeStore(storage);
    await store.bindUser("user-a", null);
    store.answer("device-word", true);
    await store.bindUser("user-a", cloud.remote);

    const words = Object.keys(store.getState().progress.words).sort();
    expect(words).toEqual(["cloud-word", "device-word"]);
    expect(Object.keys(cloud.state.stored!.words).sort()).toEqual(words);
    expect(store.getState().status).toBe("saved");
  });

  it("pulls existing cloud progress onto a fresh device", async () => {
    const cloud = fakeRemote(recordAnswer(EMPTY_PROGRESS, "w1", true, T0));
    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);
    expect(store.getState().progress.words.w1).toBeDefined();
    expect(cloud.state.saves).toBe(0);
    expect(store.getState().status).toBe("saved");
  });

  it("treats a missing or invalid cloud row as nothing to merge", async () => {
    const cloud = fakeRemote(null);
    const store = makeStore();
    await store.bindUser("user-a", null);
    store.answer("w1", true);
    await store.bindUser("user-a", cloud.remote);
    expect(cloud.state.stored?.words.w1).toBeDefined();
  });

  it("batches rapid answers into a single save after the delay", async () => {
    const cloud = fakeRemote();
    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);
    const savesAfterBind = cloud.state.saves;

    store.answer("w1", true);
    store.answer("w2", true);
    store.answer("w3", false);
    expect(cloud.state.saves).toBe(savesAfterBind);
    expect(store.getState().status).toBe("saving");

    await vi.advanceTimersByTimeAsync(SAVE_DELAY);
    expect(cloud.state.saves).toBe(savesAfterBind + 1);
    expect(Object.keys(cloud.state.stored!.words)).toHaveLength(3);
    expect(store.getState().status).toBe("saved");
  });

  it("flush saves straight away", async () => {
    const cloud = fakeRemote();
    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);
    store.answer("w1", true);
    await store.flush();
    expect(cloud.state.stored?.words.w1).toBeDefined();
  });

  it("reports an error and retries on the next answer when saving fails", async () => {
    const cloud = fakeRemote();
    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);

    cloud.state.saveError = true;
    store.answer("w1", true);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY);
    expect(store.getState().status).toBe("error");
    expect(store.getState().progress.words.w1).toBeDefined();

    cloud.state.saveError = false;
    store.answer("w2", true);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY);
    expect(store.getState().status).toBe("saved");
    expect(Object.keys(cloud.state.stored!.words).sort()).toEqual(["w1", "w2"]);
  });

  it("never overwrites cloud progress when the cloud could not be read", async () => {
    const existing = recordAnswer(EMPTY_PROGRESS, "precious", true, T0);
    const cloud = fakeRemote(existing);
    cloud.state.loadError = true;

    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);
    expect(store.getState().status).toBe("error");

    store.answer("w1", true);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY);
    expect(cloud.state.saves).toBe(0);
    expect(cloud.state.stored).toEqual(existing);

    // Once the cloud is reachable again, the next save merges instead of clobbering.
    cloud.state.loadError = false;
    store.answer("w2", true);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY);
    expect(Object.keys(cloud.state.stored!.words).sort()).toEqual(["precious", "w1", "w2"]);
  });

  it("ignores a slow cloud response that arrives after the user switched", async () => {
    let release: (value: Progress | null) => void = () => {};
    const slow: RemoteProgress = {
      load: () => new Promise((resolve) => (release = resolve)),
      save: async () => {},
    };

    const store = makeStore();
    const pending = store.bindUser("user-a", slow);
    await store.bindUser("user-b", null);

    release(recordAnswer(EMPTY_PROGRESS, "a-only", true, T0));
    await pending;

    expect(store.getState().userId).toBe("user-b");
    expect(store.getState().progress.words["a-only"]).toBeUndefined();
  });

  it("does not save after sign-out", async () => {
    const cloud = fakeRemote();
    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);
    store.answer("w1", true);
    await store.flush();
    const saves = cloud.state.saves;

    await store.bindUser(null, null);
    store.answer("w2", true);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY * 2);
    expect(cloud.state.saves).toBe(saves);
  });
});

describe("reset", () => {
  it("clears progress and syncs the empty state", async () => {
    const cloud = fakeRemote();
    const store = makeStore();
    await store.bindUser("user-a", cloud.remote);
    store.answer("w1", true);
    await store.flush();

    store.reset();
    await store.flush();
    expect(store.getState().progress).toEqual(EMPTY_PROGRESS);
    expect(cloud.state.stored).toEqual(EMPTY_PROGRESS);
  });
});
