"use client";

import { useEffect, useState } from "react";
import {
  LearnCoursePicker,
  type CourseCard,
  type IeltsCourseCard,
  type VocabGrammarCard,
} from "@/components/learn/learn-course-picker";
import {
  courseProgressStats,
  trackProgressStats,
} from "@/lib/learn/progress-utils";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { IeltsSlideCourse } from "@/lib/learn/vocab-grammar-types";

type CourseSeed = {
  id: string;
  title: string;
  description: string;
  level?: string;
  lessonIds: string[];
};

type TopicSeed = { id: string };

type IeltsCourseSeed = { course: IeltsSlideCourse; topicIds: string[] };

type Props = {
  courses: CourseSeed[];
  ieltsCourses: IeltsCourseSeed[];
  vocabGrammarTopics: TopicSeed[];
};

function toCards(
  courses: CourseSeed[],
  ieltsCourses: IeltsCourseSeed[],
  topics: TopicSeed[],
  progress: LearnProgressStore | null,
): { courses: CourseCard[]; ieltsCourses: IeltsCourseCard[]; vocabGrammar: VocabGrammarCard } {
  const empty: LearnProgressStore = {
    ownerKey: "guest_pending",
    lessons: {},
    updatedAt: new Date(0).toISOString(),
  };
  const p = progress ?? empty;
  const topicRows = topics.map((t, i) => ({ id: t.id, order: i }));
  return {
    courses: courses.map((course) => {
      const lessons = course.lessonIds.map((id) => ({ id }));
      const stats = courseProgressStats(lessons, p);
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        total: stats.total,
        completed: stats.completed,
        percent: stats.percent,
      };
    }),
    ieltsCourses: ieltsCourses.map(({ course, topicIds }) => ({
      course,
      ...trackProgressStats(topicIds.map((id, i) => ({ id, order: i })), p),
    })),
    vocabGrammar: trackProgressStats(topicRows, p),
  };
}

/**
 * Static catalog shell + client progress hydration (avoids cookies in learn RSC).
 */
export function LearnCoursePickerHydrated({
  courses,
  ieltsCourses,
  vocabGrammarTopics,
}: Props) {
  const [cards, setCards] = useState(() =>
    toCards(courses, ieltsCourses, vocabGrammarTopics, null),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/learn/progress", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { progress?: LearnProgressStore };
        if (cancelled || !data.progress) return;
        setCards(toCards(courses, ieltsCourses, vocabGrammarTopics, data.progress));
      } catch {
        /* keep zero progress */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courses, ieltsCourses, vocabGrammarTopics]);

  return (
    <LearnCoursePicker
      courses={cards.courses}
      ieltsCourses={cards.ieltsCourses}
      vocabGrammar={cards.vocabGrammar}
    />
  );
}
