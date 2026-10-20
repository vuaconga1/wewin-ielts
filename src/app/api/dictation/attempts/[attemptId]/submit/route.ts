import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitDictationAttempt } from "@/lib/dictation/store";
import { dictationErrorResponse } from "@/lib/dictation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ attemptId: string }> };

const MAX_BODY_CHARS = 64_000;

export async function POST(request: Request, { params }: Context) {
  try {
    const { attemptId } = await params;
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: "Payload too large", code: "INVALID_BODY" }, { status: 413 });
    }
    let body: { text?: unknown; answers?: unknown; listenCount?: unknown } = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      /* handled below as missing fields */
    }
    if (typeof body.text !== "string" && (!body.answers || typeof body.answers !== "object")) {
      return NextResponse.json({ error: "Missing answer", code: "INVALID_BODY" }, { status: 400 });
    }
    const user = await getSessionUser();
    const result = await submitDictationAttempt({
      attemptId,
      userId: user?.id ?? null,
      text: body.text,
      answers: body.answers,
      listenCount: Number(body.listenCount) || 0,
    });
    return NextResponse.json(result);
  } catch (err) {
    return dictationErrorResponse(err, "dictation/submit");
  }
}
