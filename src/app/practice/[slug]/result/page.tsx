import { notFound, redirect } from "next/navigation";
import {
  practiceAttemptPath,
  practiceResultPath,
} from "@/lib/practice/paths";
import { getAttempt } from "@/lib/store/test-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Legacy `/practice/[attemptId]/result` → `/practice/[slug]/[attemptId]/result`.
 */
export default async function LegacyPracticeResultRedirect({ params }: Props) {
  const { slug: attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) notFound();

  if (!attempt.finishedAt) {
    redirect(practiceAttemptPath(attempt.testSlug, attemptId));
  }
  redirect(practiceResultPath(attempt.testSlug, attemptId));
}
