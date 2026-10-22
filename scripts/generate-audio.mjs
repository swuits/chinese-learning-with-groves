// Records every word in src/lib/vocab/words.ts with a neural Mandarin voice and writes
// public/audio/<key>.mp3. Run with `npm run audio` after adding words. Needs `ffmpeg` and
// the `edge-tts` CLI (pip install edge-tts); set EDGE_TTS_BIN if it is not on your PATH.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { audioKey } from "../src/lib/vocab/audio.ts";
import { WORDS } from "../src/lib/vocab/words.ts";

const run = promisify(execFile);

const EDGE_TTS = process.env.EDGE_TTS_BIN ?? "edge-tts";
const VOICE = process.env.VOICE ?? "zh-CN-XiaoxiaoNeural";
const RATE = process.env.RATE ?? "-10%";
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 4;
const ATTEMPTS = 3;
const OUT_DIR = path.join(import.meta.dirname, "..", "public", "audio");

// Trim silence at both ends, level out the volume, then fade the first and last few
// milliseconds so playback never starts or stops with a click. A short pre-roll of silence
// gives the speakers a moment to wake up before the voice starts.
const POLISH = [
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03",
  "areverse",
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06",
  "areverse",
  "loudnorm=I=-18:TP=-2:LRA=7",
  "afade=t=in:d=0.04",
  "areverse",
  "afade=t=in:d=0.08",
  "areverse",
  "adelay=70:all=1",
].join(",");

const record = async (word, tmp) => {
  const out = path.join(OUT_DIR, `${audioKey(word.hanzi)}.mp3`);
  if (!FORCE && existsSync(out)) return "kept";

  const raw = path.join(tmp, `${audioKey(word.hanzi)}.raw.mp3`);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      await run(EDGE_TTS, ["--voice", VOICE, `--rate=${RATE}`, "--text", word.hanzi, "--write-media", raw]);
      await run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", POLISH, "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "56k", out]);
      return "made";
    } catch (error) {
      if (attempt === ATTEMPTS) throw new Error(`${word.hanzi}: ${error.message}`);
    }
  }
};

mkdirSync(OUT_DIR, { recursive: true });
const tmp = mkdtempSync(path.join(os.tmpdir(), "groves-audio-"));
const queue = [...WORDS];
const tally = { made: 0, kept: 0 };

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let word = queue.shift(); word; word = queue.shift()) tally[await record(word, tmp)] += 1;
  }),
);

rmSync(tmp, { recursive: true, force: true });
console.log(`${tally.made} recorded, ${tally.kept} already there (voice ${VOICE}, rate ${RATE}).`);
