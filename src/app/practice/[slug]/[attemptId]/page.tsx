import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/practice-session";
import { getSessionUser } from "@/lib/auth";
import { canAccessAttempt } from "@/lib/practice/attempt-access";
import {
  practiceAttemptPath,
  practiceResultPath,
} from "@/lib/practice/paths";
import { toPublicQuestion } from "@/lib/practice/public-question";
import { getAttempt, getTestBySlug } from "@/lib/store/test-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) return { title: "Practice | Wewin IELTS" };
  const test = await getTestBySlug(attempt.testSlug);
  return {
    title: test ? `${test.title} | Wewin IELTS` : "Practice | Wewin IELTS",
  };
}

export default async function PracticePage({ params }: Props) {
  const { slug, attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) notFound();

  if (slug !== attempt.testSlug) {
    redirect(practiceAttemptPath(attempt.testSlug, attemptId));
  }

  const user = await getSessionUser();
  if (!canAccessAttempt(attempt, user)) {
    if (!user) {
      redirect(
        `/login?next=${encodeURIComponent(practiceAttemptPath(slug, attemptId))}`,
      );
    }
    redirect("/forbidden");
  }

  const test = await getTestBySlug(attempt.testSlug);
  if (!test) notFound();

  if (attempt.finishedAt) {
    redirect(practiceResultPath(slug, attemptId));
  }

  const filterSet =
    attempt.questionNumbers && attempt.questionNumbers.length > 0
      ? new Set(attempt.questionNumbers)
      : null;

  const parts = test.parts
    .filter((p) => attempt.sectionOrders.includes(p.order))
    .map((p) => ({
      title: p.title,
      order: p.order,
      content: p.content,
      meta: p.meta,
      questions: p.questions
        .filter((q) => (filterSet ? filterSet.has(q.number) : true))
        .map((q) => toPublicQuestion(q)),
    }))
    .filter((p) => p.questions.length > 0);

  return (
    <PracticeSession
      attemptId={attempt.id}
      testTitle={test.title}
      skill={test.skill}
      timeLimitMinutes={attempt.timeLimitMinutes}
      startedAt={attempt.startedAt}
      initialAnswers={attempt.answers ?? {}}
      parts={parts}
      audioFiles={test.audioFiles}
      retryWrong={Boolean(filterSet)}
    />
  );
}
