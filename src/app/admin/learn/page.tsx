import Link from "next/link";
import { getCatalog } from "@/lib/learn/store";
import { LearnLessonList } from "@/components/admin/learn-lesson-list";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminLearn") };
}

export default async function AdminLearnPage() {
  const catalog = await getCatalog();
  const { t } = await getTranslations("admin");

  return (
    <SiteShell active="admin-learn">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900">
            {t("learnTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("learnDesc")}{" "}
            <Link href="/learn" className="font-medium text-wewin-navy hover:underline">
              /learn
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/admin/import"
            className="font-medium text-zinc-600 hover:text-wewin-navy"
          >
            {t("importLink")}
          </Link>
          <Link
            href="/learn"
            className="font-medium text-wewin-navy hover:underline"
          >
            {t("viewLearner")}
          </Link>
        </div>
      </div>

      <LearnLessonList catalog={catalog} />
    </SiteShell>
  );
}
