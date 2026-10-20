import { SiteShell } from "@/components/layout/site-shell";
import { DictationCatalog } from "@/components/dictation/dictation-catalog";
import { listPublishedDictations } from "@/lib/dictation/store";
import { getTranslationsStatic } from "@/i18n/server";

export const revalidate = 300;

export async function generateMetadata() {
  const { t } = getTranslationsStatic();
  return { title: t("meta.dictation") };
}

export default async function DictationCatalogPage() {
  const items = await listPublishedDictations("FULL_TEXT");
  return (
    <SiteShell active="learn">
      <DictationCatalog items={items} mode="FULL_TEXT" />
    </SiteShell>
  );
}
