/**
 * Strip exercise answer keys before shipping lessons to the browser.
 * Grading stays in POST /api/learn/progress (server).
 */

import type { LearnExercise, LearnLesson } from "@/lib/learn/types";

export type PublicLearnExercise = Omit<LearnExercise, "answers">;

export type PublicLearnLesson = Omit<LearnLesson, "exercises"> & {
  exercises: PublicLearnExercise[];
};

export function toPublicExercise(ex: LearnExercise): PublicLearnExercise {
  return {
    id: ex.id,
    type: ex.type,
    prompt: ex.prompt,
    options: ex.options,
  };
}

export function toPublicLesson(lesson: LearnLesson): PublicLearnLesson {
  return {
    ...lesson,
    exercises: lesson.exercises.map(toPublicExercise),
  };
}

/** Sidebar / unlock checks only need metadata — no exercises payload. */
export function toPublicLessonMeta(lesson: LearnLesson): PublicLearnLesson {
  return {
    ...lesson,
    exercises: [],
  };
}
