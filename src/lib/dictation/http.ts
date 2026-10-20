import { NextResponse } from "next/server";
import { DictationError } from "@/lib/dictation/store";

const STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  ALREADY_SUBMITTED: 409,
  DB_UNAVAILABLE: 503,
};

export function dictationErrorResponse(err: unknown, tag: string) {
  if (err instanceof DictationError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: STATUS[err.code] ?? 400 },
    );
  }
  console.error(`[${tag}]`, err);
  return NextResponse.json({ error: "Server error", code: "SERVER" }, { status: 500 });
}
