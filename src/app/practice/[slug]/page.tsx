import { notFound, redirect } from "next/navigation";
import {
  practiceAttemptPath,
  practiceResultPath,
} from "@/lib/practice/paths";
import { getAttempt, getTestBySlug } from "@/lib/store/test-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Legacy `/practice/[attemptId]` → `/practice/[slug]/[attemptId]`.
 * Param is named `slug` so it shares the first dynamic segment with nested routes.
 * Bare test slugs redirect to `/tests/[slug]`.
 */
export default async function LegacyPracticeRedirect({ params }: Props) {
  const { slug } = await params;

  // Legacy attempt URLs (`att_…`) or any id that still resolves as an attempt.
  const attempt = await getAttempt(slug);
  if (attempt) {
    if (attempt.finishedAt) {
      redirect(practiceResultPath(attempt.testSlug, attempt.id));
    }
    redirect(practiceAttemptPath(attempt.testSlug, attempt.id));
  }

  if (slug.startsWith("att_")) {
    notFound();
  }

  const test = await getTestBySlug(slug);
  if (test) {
    redirect(`/tests/${test.slug}`);
  }

  notFound();
}
