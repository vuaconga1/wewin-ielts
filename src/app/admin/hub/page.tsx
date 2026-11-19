import { SiteShell } from "@/components/layout/site-shell";
import { HubPanel } from "@/components/admin/hub-panel";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: t(
      "meta.adminHub",
      "Admin Panel · Placement | Wewin IELTS",
    ),
  };
}

export default async function AdminHubPage() {
  await requireAdminPage();

  return (
    <SiteShell active="admin-hub">
      <HubPanel />
    </SiteShell>
  );
}
