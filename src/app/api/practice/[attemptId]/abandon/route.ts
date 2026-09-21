import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canAccessAttempt } from "@/lib/practice/attempt-access";
import { deleteAttempt, getAttempt } from "@/lib/store/test-store";

export const runtime = "nodejs";

/**
 * Abort an in-progress attempt without scoring.
 * Deletes the attempt file so it does not appear in history.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const attempt = await getAttempt(attemptId);
    if (!attempt) {
      return NextResponse.json({ ok: true, deleted: false });
    }

    const user = await getSessionUser();
    if (!canAccessAttempt(attempt, user)) {
      return NextResponse.json(
        { error: "Không có quyền hủy bài làm này" },
        { status: 403 },
      );
    }

    if (attempt.finishedAt) {
      return NextResponse.json(
        { error: "Bài đã nộp, không hủy được" },
        { status: 400 },
      );
    }

    await deleteAttempt(attemptId);
    return NextResponse.json({ ok: true, deleted: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
