import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { expiredAccessResponse } from "@/lib/auth/access-guard";
import { canAccessAttempt } from "@/lib/practice/attempt-access";
import { sanitizeHighlights } from "@/lib/practice/passage-highlights";
import {
  getAttemptAccessMeta,
  patchAttemptDraft,
} from "@/lib/store/test-store";
import { practiceSaveBodySchema } from "@/lib/validation/practice";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const raw = await request.json().catch(() => null);
    const parsed = parseJsonBody(practiceSaveBodySchema, raw);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const meta = await getAttemptAccessMeta(attemptId);
    if (!meta) {
      return NextResponse.json({ error: "Không tìm thấy bài làm" }, { status: 404 });
    }

    const user = await getSessionUser();
    const expired = await expiredAccessResponse(user);
    if (expired) return expired;
    if (!canAccessAttempt(meta, user)) {
      return NextResponse.json(
        { error: "Không có quyền lưu bài làm này" },
        { status: 403 },
      );
    }

    if (meta.finishedAt) {
      return NextResponse.json(
        { error: "Bài đã nộp, không lưu thêm được" },
        { status: 400 },
      );
    }

    const claimUserId = user && !meta.userId ? user.id : null;
    const highlights = Array.isArray(body.highlights)
      ? sanitizeHighlights(body.highlights)
      : undefined;

    const patched = await patchAttemptDraft(attemptId, {
      answers: body.answers,
      highlights,
      claimUserId,
    });
    if (!patched) {
      return NextResponse.json({ error: "Không tìm thấy bài làm" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      updatedAt: patched.updatedAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
