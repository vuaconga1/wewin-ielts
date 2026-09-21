import { notFound } from "next/navigation";
import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getTopicBySlug, getTopicsByTrack } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopic, toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import { pickLocalized } from "@/lib/learn/vocab-grammar-types";
import { SiteShell } from "@/components/layout/site-shell";
import { VocabTopicOverview } from "@/components/learn/vocab-topic-overview";
import { getLocale, getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ topicSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug } = await params;
  const locale = await getLocale();
  const { t } = await getTranslations();
  const topic = await getTopicBySlug("vocabulary", topicSlug);
  if (!topic) return { title: t("meta.learn") };
  return {
    title: `${pickLocalized(topic.title, locale)} | ${t("learn.vocabularyTrack", "Từ vựng")}`,
  };
}

export default async function VocabularyTopicOverviewPage({ params }: Props) {
  const { topicSlug } = await params;

  const topic = await getTopicBySlug("vocabulary", topicSlug);
  if (!topic) notFound();

  const locale = await getLocale();
  const ownerKey = await getLearnOwnerKey();
  const progress = await getProgress(ownerKey);
  const topics = await getTopicsByTrack("vocabulary");

  return (
    <SiteShell active="learn" wide>
      <VocabTopicOverview
        topic={toPublicTopic(topic)}
        displayTitle={pickLocalized(topic.title, locale)}
        displaySummary={pickLocalized(topic.summary, locale)}
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
      />
    </SiteShell>
  );
}
