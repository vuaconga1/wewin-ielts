import { notFound, redirect } from "next/navigation";
import { getTopicBySlug } from "@/lib/learn/vocab-grammar-store";
import { learnVocabTopicLearnHref } from "@/lib/learn/hrefs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ topicSlug: string }>;
};

/** Vocabulary has no overview — jump straight to word cards. */
export default async function VocabularyTopicPage({ params }: Props) {
  const { topicSlug } = await params;
  const topic = await getTopicBySlug("vocabulary", topicSlug);
  if (!topic) notFound();
  redirect(learnVocabTopicLearnHref(topicSlug));
}
