"""Records a phrase with the voice, then saves only the audio of one word from it.

Used for words the voice reads wrongly on their own (neutral-tone particles such as 得 / 地 / 过, or
characters with several readings). In a phrase the voice picks the reading that fits the sentence,
and the service reports when each word starts and ends, so the word can be cut out exactly.

    python3 scripts/cut-from-phrase.py --voice zh-CN-XiaoyiNeural --rate=-8% \
        --phrase 他跑得很快 --word 得 --out raw.mp3
"""
import argparse
import asyncio
import os
import subprocess
import sys
import tempfile

import edge_tts

TICKS_PER_SECOND = 10_000_000  # the service counts in 100-nanosecond ticks
LEAD_PAD = 0.01   # seconds of the previous sound kept before the word
TAIL_PAD = 0.03   # seconds kept after it, so the end of the tone is not clipped


async def record(phrase: str, voice: str, rate: str, path: str):
    spoken = []
    boundaries = []
    with open(path, "wb") as audio:
        async for chunk in edge_tts.Communicate(phrase, voice, rate=rate, boundary="WordBoundary").stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                boundaries.append(chunk)
                spoken.append(chunk["text"])
    return boundaries, spoken


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", required=True)
    parser.add_argument("--rate", required=True)
    parser.add_argument("--phrase", required=True)
    parser.add_argument("--word", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        full = os.path.join(tmp, "phrase.mp3")
        boundaries, spoken = asyncio.run(record(args.phrase, args.voice, args.rate, full))
        match = next((b for b in boundaries if b["text"].strip("。，、！？ ") == args.word), None)
        if match is None:
            print(f"'{args.word}' is not a separate word in {spoken!r}; choose a phrase that isolates it", file=sys.stderr)
            return 2
        start = max(0.0, match["offset"] / TICKS_PER_SECOND - LEAD_PAD)
        length = match["duration"] / TICKS_PER_SECOND + LEAD_PAD + TAIL_PAD
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", full, "-ss", f"{start:.3f}", "-t", f"{length:.3f}", args.out],
            check=True,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
