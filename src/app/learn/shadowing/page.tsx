import { SiteShell } from "@/components/layout/site-shell";
import { ShadowingCatalog } from "@/components/shadowing/shadowing-catalog";
import { listPublishedShadowing } from "@/lib/shadowing/store";
import { getTranslationsStatic } from "@/i18n/server";

export const revalidate = 300;

export async function generateMetadata() {
  const { t } = getTranslationsStatic();
  return { title: t("meta.shadowing") };
}

export default async function ShadowingCatalogPage() {
  const items = await listPublishedShadowing();
  return (
    <SiteShell active="learn">
      <ShadowingCatalog items={items} />
    </SiteShell>
  );
}
