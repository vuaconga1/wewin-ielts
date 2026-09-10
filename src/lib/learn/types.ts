export const LEARN_SKILLS = [
  "listening",
  "reading",
  "writing",
  "speaking",
] as const;

export type LearnSkill = (typeof LEARN_SKILLS)[number];

export const LEARN_SKILL_LABEL: Record<LearnSkill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const LEARN_SKILL_VI: Record<LearnSkill, string> = {
  listening: "Nghe",
  reading: "Đọc",
  writing: "Viết",
  speaking: "Nói",
};

export const LEARN_SKILL_DESC: Record<LearnSkill, string> = {
  listening: "Chiến lược nghe, dạng câu hỏi và mẹo ghi đáp án",
  reading: "Đọc hiểu Passage, skimming/scanning và True/False/NG",
  writing: "Task 1 & Task 2: cấu trúc bài và từ vựng học thuật",
  speaking: "Part 1–3: trả lời mạch lạc, phát âm và ý tưởng",
};

export type LearnExerciseType =
  | "multiple_choice"
  | "short_answer"
  | "gap_fill";

export const LEARN_EXERCISE_TYPE_LABEL: Record<LearnExerciseType, string> = {
  multiple_choice: "Trắc nghiệm (MCQ)",
  short_answer: "Trả lời ngắn",
  gap_fill: "Điền từ (gap fill)",
};

export type LearnExercise = {
  id: string;
  type: LearnExerciseType;
  prompt: string;
  /** Options for multiple_choice (A/B/C/…) */
  options?: string[];
  /** Accepted answers (case-insensitive; OR) */
  answers: string[];
};

export type LearnLesson = {
  id: string;
  skill: LearnSkill;
  title: string;
  order: number;
  summary: string;
  videoUrl: string;
  durationSec?: number;
  exercises: LearnExercise[];
};

export type LearnCourse = {
  /** URL slug, e.g. ielts-4-skills */
  id: string;
  title: string;
  description: string;
  /** Shown via i18n as “Cấp độ {level}”, e.g. "A" */
  level?: string;
  lessons: LearnLesson[];
};

export type LearnCatalog = {
  courses: LearnCourse[];
};

/** @deprecated Use LearnCourse. Kept for older curriculum.json files. */
export type LearnCurriculum = LearnCourse & { courseId?: string };

export type LessonProgress = {
  lessonId: string;
  videoCompleted: boolean;
  exercisePassed: boolean;
  /** Furthest playback position unlocked by watching (seconds) */
  maxWatchedSec: number;
  updatedAt: string;
};

export type LearnProgressStore = {
  ownerKey: string;
  lessons: Record<string, LessonProgress>;
  updatedAt: string;
};

export function isLearnSkill(value: string): value is LearnSkill {
  return (LEARN_SKILLS as readonly string[]).includes(value);
}
