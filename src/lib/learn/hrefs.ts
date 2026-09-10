import type { LearnSkill } from "@/lib/learn/types";

export function learnCatalogHref(): string {
  return "/learn";
}

export function learnCourseHref(courseId: string): string {
  return `/learn/${courseId}`;
}

export function learnSkillHref(courseId: string, skill: LearnSkill): string {
  return `/learn/${courseId}/${skill}`;
}

export function learnLessonHref(
  courseId: string,
  skill: LearnSkill,
  lessonId: string,
): string {
  return `/learn/${courseId}/${skill}/${lessonId}`;
}
