import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getTopicsByTrack } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import { SiteShell } from "@/components/layout/site-shell";
import { TopicCatalog } from "@/components/learn/topic-catalog";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: `${t("learn.vocabularyTrack", "Từ vựng")} | ${t("learn.vocabGrammarCard", "Từ vựng và ngữ pháp")}`,
  };
}

export default async function VocabularyCatalogPage() {
  const { t } = await getTranslations();
  const ownerKey = await getLearnOwnerKey();
  const progress = await getProgress(ownerKey);
  const topics = await getTopicsByTrack("vocabulary");

  return (
    <SiteShell active="learn" wide>
      <TopicCatalog
        track="vocabulary"
        trackLabel={t("learn.vocabularyTrack", "Từ vựng")}
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
      />
    </SiteShell>
  );
}
