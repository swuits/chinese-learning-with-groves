// Records every word in src/lib/vocab/words.ts with a neural Mandarin voice and writes
// public/audio/<key>.mp3. Run with `npm run audio` after adding words. Needs `ffmpeg` and
// the `edge-tts` CLI (pip install edge-tts); set EDGE_TTS_BIN and EDGE_TTS_PYTHON if they are not
// on your PATH (the python must be the one edge-tts is installed in).
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { audioKey } from "../src/lib/vocab/audio.ts";
import { WORDS } from "../src/lib/vocab/words.ts";
import { SPOKEN_AS } from "./spoken-as.mjs";

const run = promisify(execFile);

const EDGE_TTS = process.env.EDGE_TTS_BIN ?? "edge-tts";
const PYTHON = process.env.EDGE_TTS_PYTHON ?? "python3";
const CUT_SCRIPT = path.join(import.meta.dirname, "cut-from-phrase.py");
const VOICE = process.env.VOICE ?? "zh-CN-XiaoyiNeural";
const RATE = process.env.RATE ?? "-8%";
const FORCE = process.argv.includes("--force");
const ONLY = process.argv.filter((a) => a.startsWith("--only=")).flatMap((a) => a.slice(7).split(","));
const CONCURRENCY = 5;
const ATTEMPTS = 3;
const PEAK_DB = -2;
const OUT_DIR = path.join(import.meta.dirname, "..", "public", "audio");

// Cut silence from both ends. The reversing trick trims the tail with the same filter.
const TRIM = [
  "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.04",
  "areverse",
  "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.08",
  "areverse",
].join(",");

// Tiny fades stop playback clicking without touching the pitch movement at the end of the
// word, which is where tones live. A short silent lead-in lets speakers wake up before the voice.
const fadeAndPad = (gainDb) =>
  `volume=${gainDb}dB,afade=t=in:d=0.012,areverse,afade=t=in:d=0.035,areverse,adelay=60:all=1`;

const peakOf = async (file) => {
  const { stderr } = await run("ffmpeg", ["-i", file, "-af", "volumedetect", "-f", "null", "-"]);
  const match = /max_volume:\s*(-?[\d.]+) dB/.exec(stderr);
  if (!match) throw new Error("could not measure volume");
  return Number(match[1]);
};

const record = async (word, tmp) => {
  const key = audioKey(word.hanzi);
  const out = path.join(OUT_DIR, `${key}.mp3`);
  if (!FORCE && ONLY.length === 0 && existsSync(out)) return "kept";

  const raw = path.join(tmp, `${key}.raw.mp3`);
  const trimmed = path.join(tmp, `${key}.trim.wav`);
  const override = SPOKEN_AS[word.hanzi];
  // A closing full stop makes the voice finish the word with a natural falling tone.
  const text = typeof override === "string" ? override : `${word.hanzi}。`;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      if (override && typeof override === "object") {
        await run(PYTHON, [CUT_SCRIPT, "--voice", VOICE, `--rate=${RATE}`, "--phrase", override.phrase, "--word", override.word, "--out", raw]);
      } else {
        await run(EDGE_TTS, ["--voice", VOICE, `--rate=${RATE}`, "--text", text, "--write-media", raw]);
      }
      await run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", TRIM, "-ac", "1", "-ar", "24000", trimmed]);
      const gain = PEAK_DB - (await peakOf(trimmed));
      await run("ffmpeg", ["-y", "-v", "error", "-i", trimmed, "-af", fadeAndPad(gain.toFixed(2)), "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "96k", out]);
      return "made";
    } catch (error) {
      if (attempt === ATTEMPTS) throw new Error(`${word.hanzi}: ${error.message}`);
    }
  }
};

mkdirSync(OUT_DIR, { recursive: true });
const tmp = mkdtempSync(path.join(os.tmpdir(), "groves-audio-"));
const queue = ONLY.length > 0 ? WORDS.filter((w) => ONLY.includes(w.hanzi)) : [...WORDS];
const total = queue.length;
const tally = { made: 0, kept: 0 };

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let word = queue.shift(); word; word = queue.shift()) {
      tally[await record(word, tmp)] += 1;
      const done = tally.made + tally.kept;
      if (done % 100 === 0) console.log(`${done}/${total}`);
    }
  }),
);

rmSync(tmp, { recursive: true, force: true });
console.log(`${tally.made} recorded, ${tally.kept} already there (voice ${VOICE}, rate ${RATE}).`);
