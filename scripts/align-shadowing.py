"""
Forced-align shadowing transcripts to their model audio with stable-ts (free, runs locally).

Called by scripts/shadowing-cues.ts; not meant to be run by hand:
    python scripts/align-shadowing.py <jobs.json> <results.json> [--model base.en] [--engine whisper|faster-whisper]

jobs.json:    [{"id": str, "slug": str, "audio": path-or-URL, "lines": [sentence, ...]}]
results.json: [{"id": str, "slug": str, "ok": bool, "lines": [{"text", "start", "end"}], "error": str?}]
"""

import argparse
import json
import re
import subprocess
import sys

import numpy as np

SAMPLE_RATE = 16000
# Widen each sentence slightly so replaying it does not clip the first/last phoneme.
LEAD_IN_SEC = 0.15
TAIL_SEC = 0.25


def decode_audio(source: str) -> np.ndarray:
    """Mono 16 kHz float32 via the FFmpeg binary bundled with imageio-ffmpeg (no system FFmpeg needed)."""
    import imageio_ffmpeg

    cmd = [
        imageio_ffmpeg.get_ffmpeg_exe(),
        "-nostdin", "-loglevel", "error",
        "-i", source,
        "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le", "-ar", str(SAMPLE_RATE),
        "-",
    ]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0


def load_model(engine: str, model_name: str):
    import stable_whisper

    if engine == "faster-whisper":
        return stable_whisper.load_faster_whisper(model_name, device="cpu", compute_type="int8")
    return stable_whisper.load_model(model_name, device="cpu")


def line_spans(lines: list[str]) -> list[int]:
    """Cumulative char end of each line in the text stable-ts aligns (each line prefixed by a space)."""
    ends, total = [], 0
    for line in lines:
        total += len(" " + re.sub(r"\s", " ", line).strip())
        ends.append(total)
    return ends


def timings_for(lines: list[str], words, duration: float) -> list[dict]:
    ends = line_spans(lines)
    starts: list[float | None] = [None] * len(lines)
    stops: list[float | None] = [None] * len(lines)

    cursor, li = 0, 0
    for w in words:
        mid = cursor + len(w.word) / 2
        cursor += len(w.word)
        while li < len(lines) - 1 and mid >= ends[li]:
            li += 1
        if w.end <= w.start:
            continue
        starts[li] = w.start if starts[li] is None else min(starts[li], w.start)
        stops[li] = w.end if stops[li] is None else max(stops[li], w.end)

    out, prev_end = [], 0.0
    for i, text in enumerate(lines):
        start = starts[i] if starts[i] is not None else prev_end
        end = stops[i] if stops[i] is not None else start
        start = max(start, prev_end)
        end = max(end, start)
        out.append({"text": text, "start": start, "end": end})
        prev_end = end

    for i, cue in enumerate(out):
        floor = out[i - 1]["end"] if i > 0 else 0.0
        ceil = out[i + 1]["start"] if i + 1 < len(out) else duration
        cue["start"] = round(max(floor, cue["start"] - LEAD_IN_SEC), 3)
        cue["end"] = round(min(ceil, cue["end"] + TAIL_SEC), 3)
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("jobs")
    parser.add_argument("results")
    parser.add_argument("--model", default="base.en")
    parser.add_argument("--engine", default="whisper", choices=["whisper", "faster-whisper"])
    args = parser.parse_args()

    with open(args.jobs, encoding="utf-8") as f:
        jobs = json.load(f)

    models: dict[str, object] = {}

    def model_for(engine: str):
        if engine not in models:
            print(f"Loading {engine} model '{args.model}' (first run downloads it)…", flush=True)
            models[engine] = load_model(engine, args.model)
        return models[engine]

    fallback = "faster-whisper" if args.engine == "whisper" else "whisper"

    def align_with(engine: str, audio: np.ndarray, lines: list[str], duration: float):
        result = model_for(engine).align(audio, "\n".join(lines), language="en", original_split=True, verbose=None)
        cues = timings_for(lines, result.all_words(), duration)
        return cues, sum(1 for c in cues if c["end"] - c["start"] <= 0.05)

    results = []
    for n, job in enumerate(jobs, 1):
        label = f"[{n}/{len(jobs)}] {job['slug']}"
        try:
            audio = decode_audio(job["audio"])
            if audio.size == 0:
                raise RuntimeError("audio decoded to nothing")
            duration = audio.size / SAMPLE_RATE
            cues, missing = align_with(args.engine, audio, job["lines"], duration)
            used = args.engine
            # Either engine can lose its place over music/noise; the other one often recovers.
            if missing:
                retry, retry_missing = align_with(fallback, audio, job["lines"], duration)
                if retry_missing < missing:
                    cues, missing, used = retry, retry_missing, fallback
            results.append(
                {"id": job["id"], "slug": job["slug"], "ok": True, "lines": cues, "missing": missing, "engine": used}
            )
            note = f" ({missing} sentence(s) without timing)" if missing else ""
            print(f"{label}: {len(cues)} sentences, {duration:.1f}s audio, {used}{note}", flush=True)
        except Exception as err:  # keep going; one bad file should not stop the batch
            results.append({"id": job["id"], "slug": job["slug"], "ok": False, "lines": [], "error": str(err)})
            print(f"{label}: FAILED — {err}", flush=True)

    with open(args.results, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
