import { SiteShell } from "@/components/layout/site-shell";
import { DictationCatalog } from "@/components/dictation/dictation-catalog";
import { listPublishedDictations } from "@/lib/dictation/store";
import { getTranslationsStatic } from "@/i18n/server";

export const revalidate = 300;

export async function generateMetadata() {
  const { t } = getTranslationsStatic();
  return { title: t("meta.listenAnswer") };
}

export default async function ListenAnswerCatalogPage() {
  const items = await listPublishedDictations("QUESTION_ANSWER");
  return (
    <SiteShell active="learn">
      <DictationCatalog items={items} mode="QUESTION_ANSWER" />
    </SiteShell>
  );
}
