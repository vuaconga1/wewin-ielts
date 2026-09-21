import type { LearnExercise } from "@/lib/learn/types";
import { toPublicExercise } from "@/lib/learn/public-lesson";
import type { TopicLesson } from "@/lib/learn/vocab-grammar-types";

export type PublicTopicExercise = Omit<LearnExercise, "answers">;

export type PublicTopicLesson = Omit<TopicLesson, "exercises"> & {
  exercises: PublicTopicExercise[];
  exerciseCount?: number;
  wordCount?: number;
};

export function toPublicTopic(lesson: TopicLesson): PublicTopicLesson {
  return {
    ...lesson,
    exercises: lesson.exercises.map(toPublicExercise),
    exerciseCount: lesson.exercises.length,
    wordCount: lesson.words?.length ?? 0,
  };
}

export function toPublicTopicMeta(lesson: TopicLesson): PublicTopicLesson {
  return {
    ...lesson,
    exercises: [],
    words: undefined,
    exerciseCount: lesson.exercises.length,
    wordCount: lesson.words?.length ?? 0,
  };
}
