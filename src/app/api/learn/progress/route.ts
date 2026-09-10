import { NextResponse } from "next/server";
import { ensureLearnOwnerKey } from "@/lib/learn/owner";
import {
  LearnStoreError,
  getProgress,
  submitExercises,
  updateVideoProgress,
} from "@/lib/learn/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerKey = await ensureLearnOwnerKey();
  const progress = await getProgress(ownerKey);
  return NextResponse.json({ ownerKey, progress });
}

type Body =
  | {
      action: "video";
      lessonId: string;
      maxWatchedSec: number;
      videoCompleted?: boolean;
    }
  | {
      action: "exercises";
      lessonId: string;
      answers: Record<string, string>;
    };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const ownerKey = await ensureLearnOwnerKey();

    if (body.action === "video") {
      if (!body.lessonId || typeof body.maxWatchedSec !== "number") {
        return NextResponse.json(
          { error: "Thiếu lessonId hoặc maxWatchedSec" },
          { status: 400 },
        );
      }
      const progress = await updateVideoProgress({
        ownerKey,
        lessonId: body.lessonId,
        maxWatchedSec: body.maxWatchedSec,
        videoCompleted: body.videoCompleted,
      });
      return NextResponse.json({ ok: true, progress });
    }

    if (body.action === "exercises") {
      if (!body.lessonId || !body.answers || typeof body.answers !== "object") {
        return NextResponse.json(
          { error: "Thiếu lessonId hoặc answers" },
          { status: 400 },
        );
      }
      const result = await submitExercises({
        ownerKey,
        lessonId: body.lessonId,
        answers: body.answers,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 });
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
