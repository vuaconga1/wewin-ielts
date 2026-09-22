import { getCatalog } from "@/lib/learn/store";
import { getVocabGrammarCatalog } from "@/lib/learn/vocab-grammar-store";
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

  const courses = catalog.courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    lessonIds: course.lessons.map((l) => l.id),
  }));

  const vocabGrammarTopics = [
    ...vgCatalog.grammar.map((t) => ({ id: t.id })),
    ...vgCatalog.vocabulary.map((t) => ({ id: t.id })),
  ];

  return (
    <SiteShell active="learn" wide>
      <LearnCoursePickerHydrated
        courses={courses}
        vocabGrammarTopics={vocabGrammarTopics}
      />
    </SiteShell>
  );
}
