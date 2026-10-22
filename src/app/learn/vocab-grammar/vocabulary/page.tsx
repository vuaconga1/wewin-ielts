import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getTopicsByTrack } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import {
  isVocabCollection,
  topicCollection,
  type VocabCollection,
} from "@/lib/learn/vocab-grammar-types";
import { SiteShell } from "@/components/layout/site-shell";
import { TopicCatalog } from "@/components/learn/topic-catalog";
import { VocabCollectionTabs } from "@/components/learn/vocab-collection-tabs";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ set?: string | string[] }>;
};

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: `${t("learn.vocabularyTrack", "Từ vựng")} | ${t("learn.vocabGrammarCard", "Từ vựng và ngữ pháp")}`,
  };
}

export default async function VocabularyCatalogPage({ searchParams }: Props) {
  const { t } = await getTranslations();
  const raw = (await searchParams).set;
  const collection: VocabCollection = isVocabCollection(raw) ? raw : "cambridge";

  const ownerKey = await getLearnOwnerKey();
  const [progress, allTopics] = await Promise.all([
    getProgress(ownerKey),
    getTopicsByTrack("vocabulary"),
  ]);
  const topics = allTopics.filter((tpc) => topicCollection(tpc) === collection);

  const labels: Record<VocabCollection, string> = {
    cambridge: t("learn.vocabCollectionCambridge", "Cambridge Vocabulary for IELTS"),
    topics: t("learn.vocabCollectionTopics", "Từ vựng IELTS theo chủ đề"),
  };

  return (
    <SiteShell active="learn" wide>
      <TopicCatalog
        track="vocabulary"
        trackLabel={t("learn.vocabularyTrack", "Từ vựng")}
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
        toolbar={<VocabCollectionTabs active={collection} labels={labels} />}
      />
    </SiteShell>
  );
}
