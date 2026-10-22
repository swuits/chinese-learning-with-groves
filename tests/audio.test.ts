import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { audioKey, audioUrl } from "@/lib/vocab/audio";
import { WORDS } from "@/lib/vocab/words";

describe("audioKey", () => {
  it("is a stable 8-character hex string", () => {
    expect(audioKey("你好")).toMatch(/^[0-9a-f]{8}$/);
    expect(audioKey("你好")).toBe(audioKey("你好"));
  });

  it("differs for different words", () => {
    expect(audioKey("你好")).not.toBe(audioKey("再见"));
    expect(audioKey("他")).not.toBe(audioKey("她"));
  });

  it("is unique across the whole word list", () => {
    const keys = WORDS.map((word) => audioKey(word.hanzi));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("audioUrl", () => {
  it("points at a plain ASCII mp3 under /audio", () => {
    expect(audioUrl(WORDS[0])).toBe(`/audio/${audioKey(WORDS[0].hanzi)}.mp3`);
  });
});

describe("recorded audio", () => {
  it.each(WORDS.map((word) => [word.hanzi, word] as const))("%s has an audio file", (_hanzi, word) => {
    const file = path.join(process.cwd(), "public", audioUrl(word));
    expect(existsSync(file), `missing ${file}; run npm run audio`).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(1000);
  });
});
