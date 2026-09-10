import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  canAccessAttempt,
  claimAttemptIfGuest,
} from "@/lib/practice/attempt-access";
import { practiceResultPath } from "@/lib/practice/paths";
import { estimateBand, gradeAnswers } from "@/lib/scoring";
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

    const test = await getTestBySlug(attempt.testSlug);
    if (!test) {
      return NextResponse.json({ error: "Không tìm thấy đề" }, { status: 404 });
    }

    claimAttemptIfGuest(attempt, user);

    const answers = body.answers ?? {};
    const selectedParts = test.parts.filter((p) =>
      attempt.sectionOrders.includes(p.order),
    );
    const filterSet =
      attempt.questionNumbers && attempt.questionNumbers.length > 0
        ? new Set(attempt.questionNumbers)
        : null;

    // Keys stay server-side; response only returns score + redirect.
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
    await saveAttempt(attempt);

    return NextResponse.json({
      attemptId,
      score: attempt.score,
      band,
      redirect: practiceResultPath(attempt.testSlug, attemptId),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
