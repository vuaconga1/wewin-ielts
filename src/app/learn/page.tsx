import { getCatalog } from "@/lib/learn/store";
import { getVocabGrammarCatalog } from "@/lib/learn/vocab-grammar-store";
import { IELTS_SLIDE_COURSES, topicCourse } from "@/lib/learn/vocab-grammar-types";
import { SiteShell } from "@/components/layout/site-shell";
import { LearnCoursePickerHydrated } from "@/components/learn/learn-course-picker-hydrated";
import { getTranslationsStatic } from "@/i18n/server";

/** Catalog is shared; progress loads client-side — enables ISR. */
export const revalidate = 300;

export async function generateMetadata() {
  const { t } = getTranslationsStatic();
  return { title: t("meta.learn") };
}

export default async function LearnCatalogPage() {
  const catalog = await getCatalog();
  const vgCatalog = await getVocabGrammarCatalog();

  const courses = catalog.courses
    .filter((course) =>
      process.env.NODE_ENV !== "production" || course.id !== "ielts-4-skills",
    )
    .map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    lessonIds: course.lessons.map((l) => l.id),
  }));

  const vocabGrammarTopics = [
    ...vgCatalog.grammar.filter((t) => topicCourse(t) === "basic").map((t) => ({ id: t.id })),
    ...vgCatalog.vocabulary.map((t) => ({ id: t.id })),
  ];

  const ieltsCourses = IELTS_SLIDE_COURSES.map((course) => ({
    course,
    topicIds: vgCatalog.grammar
      .filter((t) => topicCourse(t) === course)
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id),
  })).filter((c) => c.topicIds.length > 0);

  return (
    <SiteShell active="learn">
      <LearnCoursePickerHydrated
        courses={courses}
        ieltsCourses={ieltsCourses}
        vocabGrammarTopics={vocabGrammarTopics}
      />
    </SiteShell>
  );
}
