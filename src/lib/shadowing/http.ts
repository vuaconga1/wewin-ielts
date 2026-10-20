import { NextResponse } from "next/server";
import { ShadowingError } from "@/lib/shadowing/store";

const STATUS: Record<string, number> = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  RECORDING_GONE: 410,
  NO_SPEECH: 422,
  DB_UNAVAILABLE: 503,
};

export function shadowingErrorResponse(err: unknown, tag: string) {
  if (err instanceof ShadowingError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: STATUS[err.code] ?? 400 },
    );
  }
  console.error(`[${tag}]`, err);
  return NextResponse.json({ error: "Server error", code: "SERVER" }, { status: 500 });
}

/** Detects the real container from magic bytes; client MIME types are not trusted. */
export function sniffRecording(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { mime: "audio/webm", ext: "webm" };
  }
  if (buf.toString("ascii", 0, 4) === "OggS") return { mime: "audio/ogg", ext: "ogg" };
  if (buf.toString("ascii", 4, 8) === "ftyp") return { mime: "audio/mp4", ext: "m4a" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE") {
    return { mime: "audio/wav", ext: "wav" };
  }
  return null;
}
