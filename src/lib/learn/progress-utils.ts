import type { LearnLesson, LearnProgressStore } from "@/lib/learn/types";

/** First lesson unlocked; later ones need previous exercisePassed. */
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
