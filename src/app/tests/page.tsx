import Link from "next/link";
import { listTests } from "@/lib/store/test-store";
import { normalizeExamType } from "@/lib/tests/exam-type";
import { TestsModulePicker } from "@/components/tests/tests-module-picker";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslationsStatic } from "@/i18n/server";

/** Catalog — ISR; shell session is client-hydrated (no cookies in RSC). */
export const revalidate = 300;

export async function generateMetadata() {
  const { t } = getTranslationsStatic();
  return { title: t("meta.tests") };
}

export default async function TestsPage() {
  const tests = await listTests();
  const { t } = getTranslationsStatic();

  let academicCount = 0;
  let generalCount = 0;
  let placementCount = 0;
  for (const row of tests) {
    const type = normalizeExamType(row.examType);
    if (type === "GENERAL") generalCount += 1;
    else if (type === "PLACEMENT") placementCount += 1;
    else academicCount += 1;
  }

  return (
    <SiteShell active="tests">
      <div data-tour="tests-header" className="mb-6 min-w-0">
        <Link
          href="/"
          className="mb-3 inline-block text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("common.backHome")}
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900">{t("tests.title")}</h1>
   
      </div>

      <TestsModulePicker
        academicCount={academicCount}
        generalCount={generalCount}
        placementCount={placementCount}
      />
    </SiteShell>
  );
}
