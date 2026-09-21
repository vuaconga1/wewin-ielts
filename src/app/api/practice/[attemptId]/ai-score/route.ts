import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { runAiScoreForAttempt } from "@/lib/ai/run-score";
import { getAiQuota } from "@/lib/ai/quota";
import { isOpenAiConfigured } from "@/lib/ai/config";
import type { AiScoreSkill } from "@/lib/ai/types";
import {
  canAccessAttempt,
  claimAttemptIfGuest,
} from "@/lib/practice/attempt-access";
import {
  buildSpeakingExamQueue,
  filterSpeakingExamQueue,
  parseSpeakingPartKinds,
  partsForSpeakingAttempt,
} from "@/lib/practice/speaking-exam";
import { getAttempt, getTestBySlug, saveAttempt } from "@/lib/store/test-store";

export const runtime = "nodejs";
export const maxDuration = 120;

const NONCE_HEADER = "x-wewin-ai-score-nonce";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const attempt = await getAttempt(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Không tìm thấy bài làm" }, { status: 404 });
    }

    const user = await getSessionUser();
    if (!canAccessAttempt(attempt, user)) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const test = await getTestBySlug(attempt.testSlug);
    const skill = test?.skill;
    const aiSkill: AiScoreSkill | null =
      skill === "SPEAKING" || skill === "WRITING" ? skill : null;

    let quota = null;
    if (user && aiSkill) {
      quota = await getAiQuota(user.id);
    }

    return NextResponse.json({
      configured: isOpenAiConfigured(),
      skill: aiSkill,
      aiScore: attempt.aiScore ?? null,
      quota,
      unlimited: isAdmin(user),
      /** Scoring is never started from the result page — only right after submit. */
      canScore: false,
      loggedIn: Boolean(user),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * AI scoring is allowed ONLY with the one-time nonce from POST /submit
 * (manual submit or auto-submit at timeout). Leave / abandon / refresh / replay
 * cannot spend OpenAI credits.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const attempt = await getAttempt(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Không tìm thấy bài làm" }, { status: 404 });
    }

    if (!attempt.finishedAt) {
      return NextResponse.json(
        { error: "Chỉ chấm AI sau khi nộp bài" },
        { status: 400 },
      );
    }

    const nonceHeader = request.headers.get(NONCE_HEADER)?.trim() ?? "";
    if (!nonceHeader || !attempt.aiScoreNonce || nonceHeader !== attempt.aiScoreNonce) {
      return NextResponse.json(
        {
          error:
            "Chấm AI chỉ chạy ngay sau khi nộp bài (hoặc hết giờ tự nộp). Token không hợp lệ hoặc đã dùng.",
          aiScore: attempt.aiScore ?? null,
        },
        { status: 403 },
      );
    }

    // Already resolved — burn nonce if somehow still present, no OpenAI
    if (attempt.aiScore?.status && attempt.aiScore.status !== "pending") {
      attempt.aiScoreNonce = null;
      await saveAttempt(attempt);
      return NextResponse.json({ aiScore: attempt.aiScore });
    }

    const user = await getSessionUser();
    if (!canAccessAttempt(attempt, user)) {
      return NextResponse.json(
        { error: "Không có quyền chấm bài này" },
        { status: 403 },
      );
    }

    claimAttemptIfGuest(attempt, user);

    const test = await getTestBySlug(attempt.testSlug);
    if (!test) {
      return NextResponse.json({ error: "Không tìm thấy đề" }, { status: 404 });
    }

    if (test.skill !== "SPEAKING" && test.skill !== "WRITING") {
      attempt.aiScoreNonce = null;
      await saveAttempt(attempt);
      return NextResponse.json(
        { error: "AI scoring chỉ hỗ trợ Speaking và Writing" },
        { status: 400 },
      );
    }

    const skill = test.skill as AiScoreSkill;
    const filterSet =
      attempt.questionNumbers && attempt.questionNumbers.length > 0
        ? new Set(attempt.questionNumbers)
        : null;

    if (skill === "WRITING") {
      const parts = test.parts.filter((p) =>
        attempt.sectionOrders.includes(p.order),
      );
      const writingTasks = parts.flatMap((part) =>
        part.questions
          .filter((q) => (filterSet ? filterSet.has(q.number) : true))
          .map((q) => {
            const content = (q.content ?? {}) as Record<string, unknown>;
            const stem =
              typeof content.stem === "string"
                ? content.stem
                : typeof content.passage === "string"
                  ? content.passage
                  : "";
            return {
              number: q.number,
              label: part.title,
              prompt: stem,
              essay: attempt.answers[String(q.number)] ?? "",
              minWords:
                typeof content.minWords === "number"
                  ? content.minWords
                  : undefined,
            };
          }),
      );

      const { aiScore } = await runAiScoreForAttempt({
        attempt,
        skill,
        user,
        writingTasks,
      });

      return NextResponse.json({ aiScore });
    }

    // SPEAKING
    const contentType = request.headers.get("content-type") ?? "";
    const sectionParts = partsForSpeakingAttempt(test.parts, attempt);
    const queue = filterSpeakingExamQueue(
      buildSpeakingExamQueue(sectionParts),
      parseSpeakingPartKinds(attempt.speakingPartKinds),
    ).filter((it) => (filterSet ? filterSet.has(it.number) : true));

    const speakingClips = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const item of queue) {
        const file = form.get(`audio_${item.number}`);
        if (!(file instanceof File) || file.size <= 0) continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        speakingClips.push({
          number: item.number,
          label: `Part ${item.partKind}`,
          prompt: item.stem,
          partKind: item.partKind,
          buffer,
          filename: file.name || `q${item.number}.webm`,
          mimeType: file.type || "audio/webm",
        });
      }
    }

    // No audio at submit → close nonce without OpenAI cost
    const { aiScore } = await runAiScoreForAttempt({
      attempt,
      skill,
      user,
      speakingClips,
    });

    return NextResponse.json({ aiScore });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
