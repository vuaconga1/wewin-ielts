import { NextResponse } from "next/server";
import {
  createAttempt,
  findOpenAttempt,
  getTestBySlug,
} from "@/lib/store/test-store";
import { getSessionUser } from "@/lib/auth";
import { practiceAttemptPath } from "@/lib/practice/paths";
import { parseSpeakingPartKinds } from "@/lib/practice/speaking-exam";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      mode?: "PRACTICE" | "FULL";
      sectionOrders?: number[];
      questionNumbers?: number[];
      speakingPartKinds?: number[];
      timeLimitMinutes?: number | null;
    };

    const slug = body.slug?.trim();
    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
    }

    const test = await getTestBySlug(slug);
    if (!test) {
      return NextResponse.json({ error: "Không tìm thấy đề" }, { status: 404 });
    }

    const mode = body.mode === "FULL" ? "FULL" : "PRACTICE";
    let sectionOrders = body.sectionOrders ?? [];
    let speakingPartKinds = parseSpeakingPartKinds(body.speakingPartKinds);

    if (test.skill === "SPEAKING") {
      if (mode === "FULL") {
        speakingPartKinds = [1, 2, 3];
        sectionOrders = test.parts.map((p) => p.order);
      } else if (speakingPartKinds?.length) {
        sectionOrders = test.parts.map((p) => p.order);
      }
    } else {
      speakingPartKinds = null;
    }

    if (mode === "FULL" && test.skill !== "SPEAKING") {
      sectionOrders = test.parts.map((p) => p.order);
    }

    if (sectionOrders.length === 0) {
      return NextResponse.json(
        { error: "Chọn ít nhất 1 phần thi" },
        { status: 400 },
      );
    }

    const rawQuestionNumbers = Array.isArray(body.questionNumbers)
      ? body.questionNumbers
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n > 0)
      : undefined;

    let questionNumbers: number[] | undefined;
    if (rawQuestionNumbers?.length) {
      if (speakingPartKinds) {
        questionNumbers = [...new Set(rawQuestionNumbers)];
      } else {
        const allowed = new Set(
          test.parts
            .filter((p) => sectionOrders.includes(p.order))
            .flatMap((p) => p.questions.map((q) => q.number)),
        );
        questionNumbers = [...new Set(rawQuestionNumbers)].filter((n) =>
          allowed.has(n),
        );
        if (questionNumbers.length === 0) {
          return NextResponse.json(
            { error: "Không có câu hỏi hợp lệ để làm lại" },
            { status: 400 },
          );
        }
        // Keep only sections that contain at least one selected question
        sectionOrders = test.parts
          .filter(
            (p) =>
              sectionOrders.includes(p.order) &&
              p.questions.some((q) => questionNumbers!.includes(q.number)),
          )
          .map((p) => p.order);
      }
    }

    const timeLimitMinutes =
      body.timeLimitMinutes === undefined
        ? test.timeLimitMinutes ?? null
        : body.timeLimitMinutes;

    const user = await getSessionUser();

    if (user) {
      const existing = await findOpenAttempt({
        testSlug: slug,
        userId: user.id,
        mode,
        sectionOrders,
        questionNumbers,
        speakingPartKinds: speakingPartKinds ?? undefined,
      });
      if (existing) {
        return NextResponse.json({
          attemptId: existing.id,
          resumed: true,
          redirect: practiceAttemptPath(slug, existing.id),
        });
      }
    }

    const attempt = await createAttempt({
      testSlug: slug,
      mode,
      sectionOrders,
      questionNumbers,
      speakingPartKinds: speakingPartKinds ?? undefined,
      timeLimitMinutes,
      userId: user?.id ?? null,
    });

    return NextResponse.json({
      attemptId: attempt.id,
      resumed: false,
      redirect: practiceAttemptPath(slug, attempt.id),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
