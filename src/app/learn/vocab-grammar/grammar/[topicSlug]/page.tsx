import { notFound } from "next/navigation";
import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getTopicBySlug, getTopicsByTrack } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopic, toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import { pickLocalized } from "@/lib/learn/vocab-grammar-types";
import { SiteShell } from "@/components/layout/site-shell";
import { TopicLessonPlayer } from "@/components/learn/topic-lesson-player";
import { getLocale, getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ topicSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug } = await params;
  const locale = await getLocale();
  const { t } = await getTranslations();
  const topic = await getTopicBySlug("grammar", topicSlug);
  if (!topic) return { title: t("meta.learn") };
  return {
    title: `${pickLocalized(topic.title, locale)} | ${t("learn.grammarTrack", "Ngữ pháp")}`,
  };
}

export default async function GrammarTopicPage({ params }: Props) {
  const { topicSlug } = await params;

  const topic = await getTopicBySlug("grammar", topicSlug);
  if (!topic) notFound();

  const locale = await getLocale();
  const { t } = await getTranslations();
  const ownerKey = await getLearnOwnerKey();
  const progress = await getProgress(ownerKey);
  const topics = await getTopicsByTrack("grammar");
  const ordered = [...topics].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((tpc) => tpc.slug === topicSlug);
  const prev = idx > 0 ? ordered[idx - 1] : undefined;
  const next = idx >= 0 ? ordered[idx + 1] : undefined;

  return (
    <SiteShell active="learn" wide>
      <TopicLessonPlayer
        track="grammar"
        moduleTitle={t("learn.grammarTrack", "Ngữ pháp IELTS")}
        trackLabel={t("learn.grammarTrack", "Ngữ pháp")}
        topic={toPublicTopic(topic)}
        displayTitle={pickLocalized(topic.title, locale)}
        displaySummary={pickLocalized(topic.summary, locale)}
        theoryHtml={pickLocalized(topic.theoryHtml, locale)}
        slidesHtml={
          topic.slidesHtml ? pickLocalized(topic.slidesHtml, locale) : undefined
        }
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
        prevSlug={prev?.slug ?? null}
        nextSlug={next?.slug ?? null}
        nextTitle={next ? pickLocalized(next.title, locale) : null}
      />
    </SiteShell>
  );
}
