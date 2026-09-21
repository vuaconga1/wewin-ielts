import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getVocabGrammarCatalog } from "@/lib/learn/vocab-grammar-store";
import { isTopicUnlocked, trackProgressStats } from "@/lib/learn/progress-utils";
import { SiteShell } from "@/components/layout/site-shell";
import { VocabGrammarHub } from "@/components/learn/vocab-grammar-hub";
import { getTranslations } from "@/i18n/server";
import type { VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";

export const dynamic = "force-dynamic";

function pickNextSlug(
  track: VocabGrammarTrack,
  catalog: Awaited<ReturnType<typeof getVocabGrammarCatalog>>,
  progress: Awaited<ReturnType<typeof getProgress>>,
): string | null {
  const topics = catalog[track];
  for (const topic of topics) {
    if (!isTopicUnlocked(topic, topics, progress)) continue;
    if (!progress.lessons[topic.id]?.exercisePassed) return topic.slug;
  }
  return topics[0]?.slug ?? null;
}

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: `${t("learn.vocabGrammarCard", "Từ vựng và ngữ pháp")} | ${t("meta.learn")}`,
  };
}

export default async function VocabGrammarHubPage() {
  const ownerKey = await getLearnOwnerKey();
  const progress = await getProgress(ownerKey);
  const catalog = await getVocabGrammarCatalog();

  const tracks = (["grammar", "vocabulary"] as const).map((track) => {
    const topics = catalog[track];
    const stats = trackProgressStats(topics, progress);
    return {
      track,
      total: stats.total,
      completed: stats.completed,
      percent: stats.percent,
      nextSlug: pickNextSlug(track, catalog, progress),
    };
  });

  return (
    <SiteShell active="learn" wide>
      <VocabGrammarHub tracks={tracks} />
    </SiteShell>
  );
}
