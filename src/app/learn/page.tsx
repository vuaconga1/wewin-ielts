import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getCatalog, getProgress } from "@/lib/learn/store";
import { getVocabGrammarCatalog } from "@/lib/learn/vocab-grammar-store";
import { courseProgressStats, trackProgressStats } from "@/lib/learn/progress-utils";
import { SiteShell } from "@/components/layout/site-shell";
import { LearnCoursePicker } from "@/components/learn/learn-course-picker";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.learn") };
}

export default async function LearnCatalogPage() {
  const ownerKey = await getLearnOwnerKey();
  const catalog = await getCatalog();
  const progress = await getProgress(ownerKey);

  const courses = catalog.courses.map((course) => {
    const stats = courseProgressStats(course.lessons, progress);
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      total: stats.total,
      completed: stats.completed,
      percent: stats.percent,
    };
  });

  const vgCatalog = await getVocabGrammarCatalog();
  const allTopics = [...vgCatalog.grammar, ...vgCatalog.vocabulary];
  const vocabGrammar = trackProgressStats(allTopics, progress);

  return (
    <SiteShell active="learn" wide>
      <LearnCoursePicker courses={courses} vocabGrammar={vocabGrammar} />
    </SiteShell>
  );
}
