import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateClassProgress } from "@/lib/classroom/homework";

export const runtime = "nodejs";

const attemptSchema = z.object({
  worksheetId: z.string().min(1).max(100),
  worksheetSlug: z.string().min(1).max(200),
  sectionOrders: z.array(z.number().int().min(1)).min(1),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  sectionScores: z.record(z.string(), z.object({ correct: z.number(), total: z.number() })).optional(),
  userAnswers: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = attemptSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "INVALID_BODY", details: parsed.error.issues }, { status: 400 });
    }

    const { worksheetId, worksheetSlug, sectionOrders, score, totalQuestions, sectionScores, userAnswers } = parsed.data;

    const attempt = await prisma.worksheetAttempt.create({
      data: {
        userId: user.id,
        worksheetId,
        worksheetSlug,
        sectionOrders,
        score,
        totalQuestions,
        sectionScores: sectionScores ?? undefined,
        userAnswers: userAnswers ?? undefined,
        completedAt: new Date(),
      },
    });

    // Invalidate class homework cache for enrolled classes
    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { classroomId: true },
    });
    for (const enr of enrollments) {
      invalidateClassProgress(enr.classroomId);
    }

    return NextResponse.json({ ok: true, attemptId: attempt.id });
  } catch (error) {
    console.error("Failed to save worksheet attempt:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

