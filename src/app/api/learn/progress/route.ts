import { NextResponse } from "next/server";
import { ensureLearnOwnerKey } from "@/lib/learn/owner";
import {
  LearnStoreError,
  getProgress,
  markTopicComplete,
  submitExercises,
  updateVideoProgress,
} from "@/lib/learn/store";
import { learnProgressBodySchema } from "@/lib/validation/practice";
import { parseJsonBody } from "@/lib/validation/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerKey = await ensureLearnOwnerKey();
  const progress = await getProgress(ownerKey);
  return NextResponse.json({ ownerKey, progress });
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = parseJsonBody(learnProgressBodySchema, raw);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const ownerKey = await ensureLearnOwnerKey();

    if (body.action === "video") {
      const progress = await updateVideoProgress({
        ownerKey,
        lessonId: body.lessonId,
        maxWatchedSec: body.maxWatchedSec,
        videoCompleted: body.videoCompleted,
      });
      return NextResponse.json({ ok: true, progress });
    }

    if (body.action === "exercises") {
      const result = await submitExercises({
        ownerKey,
        lessonId: body.lessonId,
        answers: body.answers,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    const result = await markTopicComplete({
      ownerKey,
      lessonId: body.lessonId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof LearnStoreError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code === "VIDEO_REQUIRED" ? 403 : 400 },
      );
    }
    console.error("[learn/progress]", err);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
