import { Suspense } from "react";
import Link from "next/link";
import { listTests } from "@/lib/store/test-store";
import { TestsCatalog } from "@/components/tests/tests-catalog";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.tests") };
}

type Props = {
  searchParams: Promise<{ skill?: string }>;
};

export default async function TestsPage({ searchParams }: Props) {
  const { skill } = await searchParams;
  const tests = await listTests();
  const { t } = await getTranslations();

  const catalog = tests.map((trow) => ({
    slug: trow.slug,
    title: trow.title,
    skill: trow.skill,
    examType: trow.examType,
    timeLimitMinutes: trow.timeLimitMinutes ?? null,
    tags: trow.tags,
    partsCount: trow.parts.length,
    questionCount: trow.parts.reduce((s, p) => s + p.questions.length, 0),
    hasAudio: (trow.audioFiles?.length ?? 0) > 0,
    savedAt: trow.savedAt,
  }));

  return (
    <SiteShell active="tests">
      <div data-tour="tests-header" className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-block text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("common.backHome")}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">{t("tests.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t("tests.subtitle")}{" "}
          <Link href="/learn" className="font-medium text-wewin-navy hover:underline">
            {t("tests.learnLink")}
          </Link>
          .
        </p>
      </div>

      {tests.length === 0 ? (
        <div data-tour="tests-catalog">
          <EmptyState
            icon="book"
            title={t("tests.emptyTitle")}
            description={t("tests.emptyDesc")}
            actionHref="/admin/import"
            actionLabel={t("tests.emptyAction")}
            secondaryHref="/login"
            secondaryLabel={t("tests.emptySecondary")}
          />
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="card-outline h-48 animate-pulse bg-zinc-100/80"
                />
              ))}
            </div>
          }
        >
          <TestsCatalog tests={catalog} initialSkill={skill} />
        </Suspense>
      )}
    </SiteShell>
  );
}
