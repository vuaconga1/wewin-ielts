import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  canAccessAttempt,
  claimAttemptIfGuest,
} from "@/lib/practice/attempt-access";
import { practiceResultPath } from "@/lib/practice/paths";
import { estimateBand, gradeAnswers } from "@/lib/scoring";
import { partsForSpeakingAttempt } from "@/lib/practice/speaking-exam";
import { getAttempt, getTestBySlug, saveAttempt } from "@/lib/store/test-store";

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
        { error: "Không có quyền nộp bài làm này" },
        { status: 403 },
      );
    }

    // Already submitted — do not re-issue AI nonce (avoids free re-score)
    if (attempt.finishedAt) {
      return NextResponse.json({
        attemptId,
        score: attempt.score ?? null,
        band: attempt.score
          ? estimateBand(attempt.score.correct, attempt.score.total)
          : null,
        redirect: practiceResultPath(attempt.testSlug, attemptId),
        aiScoreNonce: null,
        alreadySubmitted: true,
      });
    }

    const test = await getTestBySlug(attempt.testSlug);
    if (!test) {
      return NextResponse.json({ error: "Không tìm thấy đề" }, { status: 404 });
    }

    claimAttemptIfGuest(attempt, user);

    const answers = body.answers ?? {};
    const selectedParts =
      test.skill === "SPEAKING"
        ? partsForSpeakingAttempt(test.parts, attempt)
        : test.parts.filter((p) => attempt.sectionOrders.includes(p.order));
    const filterSet =
      attempt.questionNumbers && attempt.questionNumbers.length > 0
        ? new Set(attempt.questionNumbers)
        : null;

    const questions = selectedParts.flatMap((part) =>
      part.questions
        .filter((q) => (filterSet ? filterSet.has(q.number) : true))
        .map((q) => ({
          number: q.number,
          type: q.type,
          content: q.content,
          correctAnswer: q.correctAnswer,
          acceptableAnswers: q.acceptableAnswers,
          explanation: q.explanation,
          sectionTitle: part.title,
          sectionOrder: part.order,
        })),
    );

    const grade = gradeAnswers(questions, answers);
    const band = estimateBand(grade.correct, grade.total);

    attempt.answers = answers;
    attempt.finishedAt = new Date().toISOString();
    attempt.score = {
      correct: grade.correct,
      total: grade.total,
      percent: grade.percent,
    };

    // One-time AI scoring right only after this submit (Writing / Speaking)
    const needsAi = test.skill === "WRITING" || test.skill === "SPEAKING";
    const aiScoreNonce = needsAi ? randomBytes(24).toString("hex") : null;
    attempt.aiScoreNonce = aiScoreNonce;
    // Clear any stale score marker from a previous partial state
    if (!attempt.aiScore) {
      attempt.aiScore = undefined;
    }

    await saveAttempt(attempt);

    return NextResponse.json({
      attemptId,
      score: attempt.score,
      band,
      redirect: practiceResultPath(attempt.testSlug, attemptId),
      aiScoreNonce,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
