import type { LearnLesson, LearnProgressStore } from "@/lib/learn/types";
import type { TopicLesson } from "@/lib/learn/vocab-grammar-types";

/** First lesson unlocked; later ones need previous exercisePassed.
 * Vocabulary topics have no exercises — all are open. */
export function isLessonUnlocked(
  lesson: Pick<LearnLesson, "id" | "order">,
  skillLessons: Pick<LearnLesson, "id" | "order">[],
  progress: LearnProgressStore,
): boolean {
  const ordered = [...skillLessons].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  if (idx <= 0) return true;
  const prev = ordered[idx - 1]!;
  return Boolean(progress.lessons[prev.id]?.exercisePassed);
}

export function skillProgressStats(
  skillLessons: Pick<LearnLesson, "id" | "order">[],
  progress: LearnProgressStore,
) {
  const total = skillLessons.length;
  let completed = 0;
  let unlocked = 0;
  for (const lesson of skillLessons) {
    if (isLessonUnlocked(lesson, skillLessons, progress)) unlocked += 1;
    if (progress.lessons[lesson.id]?.exercisePassed) completed += 1;
  }
  return {
    total,
    completed,
    unlocked,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function isTopicUnlocked(
  topic: Pick<TopicLesson, "id" | "order" | "track">,
  topics: Pick<TopicLesson, "id" | "order" | "track">[],
  progress: LearnProgressStore,
  trackHint?: TopicLesson["track"],
): boolean {
  // Flashcard-only vocabulary: never gate on previous-topic completion.
  if (topic.track === "vocabulary" || trackHint === "vocabulary") return true;
  return isLessonUnlocked(topic, topics, progress);
}

export function trackProgressStats(
  topics: Pick<TopicLesson, "id" | "order">[],
  progress: LearnProgressStore,
) {
  return skillProgressStats(topics, progress);
}

export function courseProgressStats(
  lessons: Pick<LearnLesson, "id">[],
  progress: LearnProgressStore,
) {
  const total = lessons.length;
  let completed = 0;
  for (const lesson of lessons) {
    if (progress.lessons[lesson.id]?.exercisePassed) completed += 1;
  }
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
