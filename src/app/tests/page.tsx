import Link from "next/link";
import { listTests } from "@/lib/store/test-store";
import { normalizeExamType } from "@/lib/tests/exam-type";
import { TestsModulePicker } from "@/components/tests/tests-module-picker";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.tests") };
}

export default async function TestsPage() {
  const tests = await listTests();
  const { t } = await getTranslations();

  let academicCount = 0;
  let generalCount = 0;
  for (const row of tests) {
    if (normalizeExamType(row.examType) === "GENERAL") generalCount += 1;
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
        <h1 className="text-2xl font-bold text-zinc-900">{t("tests.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t(
            "tests.chooserSubtitle",
            "Chọn module IELTS Academic hoặc General Training, rồi lọc theo kỹ năng để luyện tập. Chưa nắm kiến thức?",
          )}{" "}
          <Link href="/learn" className="font-medium text-wewin-navy hover:underline">
            {t("tests.learnLink")}
          </Link>
          .
        </p>
      </div>

      <TestsModulePicker
        academicCount={academicCount}
        generalCount={generalCount}
      />
    </SiteShell>
  );
}
