import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  canAccessAttempt,
  claimAttemptIfGuest,
} from "@/lib/practice/attempt-access";
import { getAttempt, saveAttempt } from "@/lib/store/test-store";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const body = (await request.json()) as {
      answers?: Record<string, string>;
    };

    const attempt = await getAttempt(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Không tìm thấy bài làm" }, { status: 404 });
    }

    const user = await getSessionUser();
    if (!canAccessAttempt(attempt, user)) {
      return NextResponse.json(
        { error: "Không có quyền lưu bài làm này" },
        { status: 403 },
      );
    }

    if (attempt.finishedAt) {
      return NextResponse.json(
        { error: "Bài đã nộp, không lưu thêm được" },
        { status: 400 },
      );
    }

    claimAttemptIfGuest(attempt, user);

    attempt.answers = body.answers ?? attempt.answers;
    await saveAttempt(attempt);

    return NextResponse.json({
      ok: true,
      updatedAt: attempt.updatedAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
