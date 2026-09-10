/** Human-readable practice URLs: `/practice/[slug]/[attemptId](/result)` */

export function practiceAttemptPath(slug: string, attemptId: string): string {
  return `/practice/${slug}/${attemptId}`;
}

export function practiceResultPath(slug: string, attemptId: string): string {
  return `/practice/${slug}/${attemptId}/result`;
}

export function practicePath(
  slug: string,
  attemptId: string,
  finished: boolean,
): string {
  return finished
    ? practiceResultPath(slug, attemptId)
    : practiceAttemptPath(slug, attemptId);
}
