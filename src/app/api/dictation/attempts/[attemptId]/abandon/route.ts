import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { abandonDictationAttempt } from "@/lib/dictation/store";
import { dictationErrorResponse } from "@/lib/dictation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ attemptId: string }> };

/** Called via `navigator.sendBeacon` when the learner leaves before submitting. */
export async function POST(_request: Request, { params }: Context) {
  try {
    const { attemptId } = await params;
    const user = await getSessionUser();
    await abandonDictationAttempt({ attemptId, userId: user?.id ?? null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dictationErrorResponse(err, "dictation/abandon");
  }
}
