"""
Transcribe a shadowing video's audio with Whisper via stable-ts (free, runs locally).

Called by scripts/shadowing-import-video.ts when a video has no human-made English subtitles:
    python scripts/transcribe-shadowing.py <audio> <out.json> [--model small.en]

out.json: {"text": str}
"""

import argparse
import importlib.util
import json
import sys
from pathlib import Path


def load_align_module():
    spec = importlib.util.spec_from_file_location("align_shadowing", Path(__file__).with_name("align-shadowing.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio")
    parser.add_argument("out")
    parser.add_argument("--model", default="small.en")
    args = parser.parse_args()

    import stable_whisper

    audio = load_align_module().decode_audio(args.audio)
    print(f"Transcribing with Whisper '{args.model}' (first run downloads it)…", flush=True)
    model = stable_whisper.load_model(args.model, device="cpu")
    result = model.transcribe(audio, language="en", verbose=None)
    text = " ".join(seg.text.strip() for seg in result.segments if seg.text.strip())

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"text": text}, f, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
