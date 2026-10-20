import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDictationAttemptReview } from "@/lib/dictation/store";
import { dictationErrorResponse } from "@/lib/dictation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ attemptId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { attemptId } = await params;
    const user = await getSessionUser();
    const review = await getDictationAttemptReview({ attemptId, userId: user?.id ?? null });
    return NextResponse.json(review, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return dictationErrorResponse(err, "dictation/review");
  }
}
