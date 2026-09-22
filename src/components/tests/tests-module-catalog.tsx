import { Suspense } from "react";
import Link from "next/link";
import { listTests } from "@/lib/store/test-store";
import {
  normalizeExamType,
  type ExamType,
} from "@/lib/tests/exam-type";
import { TestsCatalog, type CatalogTest } from "@/components/tests/tests-catalog";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslationsStatic } from "@/i18n/server";
import { buildSpeakingExamQueue } from "@/lib/practice/speaking-exam";

function toCatalog(tests: Awaited<ReturnType<typeof listTests>>): CatalogTest[] {
  return tests.map((trow) => {
    const speakingQueue =
      trow.skill === "SPEAKING" ? buildSpeakingExamQueue(trow.parts) : [];
    return {
      slug: trow.slug,
      title: trow.title,
      skill: trow.skill,
      examType: normalizeExamType(trow.examType),
      timeLimitMinutes: trow.timeLimitMinutes ?? null,
      tags: trow.tags,
      partsCount:
        trow.skill === "SPEAKING" && speakingQueue.length > 0
          ? 3
          : trow.parts.length,
      questionCount:
        speakingQueue.length > 0
          ? speakingQueue.length
          : trow.parts.reduce((s, p) => s + p.questions.length, 0),
      hasAudio: (trow.audioFiles?.length ?? 0) > 0,
      savedAt: trow.savedAt,
    };
  });
}

type Props = {
  examType: ExamType;
  initialSkill?: string;
};

export async function TestsModuleCatalog({ examType, initialSkill }: Props) {
  const all = await listTests();
  const tests = all.filter((t) => normalizeExamType(t.examType) === examType);
  const catalog = toCatalog(tests);
  const { t } = getTranslationsStatic("tests");

  const isAcademic = examType === "ACADEMIC";
  const moduleTitle = isAcademic
    ? t("moduleAcademic", "IELTS Academic")
    : t("moduleGeneral", "IELTS General Training");
  const moduleSubtitle = isAcademic
    ? t(
        "moduleAcademicSubtitle",
        "Chọn đề Listening, Reading, Writing hoặc Speaking để luyện tập. Chưa nắm kiến thức?",
      )
    : t(
        "moduleGeneralSubtitle",
        "Chọn đề Listening, Reading, Writing hoặc Speaking (General Training). Chưa nắm kiến thức?",
      );

  return (
    <SiteShell active="tests">
      <div data-tour="tests-header" className="mb-6 min-w-0">
        <Link
          href="/tests"
          className="mb-3 inline-block text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backModules", "← Chọn Academic / General")}
        </Link>
        <h1 className="break-words text-2xl font-bold text-zinc-900">
          {moduleTitle}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {moduleSubtitle}{" "}
          <Link href="/learn" className="font-medium text-wewin-navy hover:underline">
            {t("learnLink", "Học 4 kỹ năng")}
          </Link>
          .
        </p>
      </div>

      {tests.length === 0 ? (
        <div data-tour="tests-catalog">
          <EmptyState
            icon="book"
            title={
              isAcademic
                ? t("emptyAcademicTitle", "Chưa có đề Academic")
                : t("emptyGeneralTitle", "Chưa có đề General Training")
            }
            description={
              isAcademic
                ? t(
                    "emptyAcademicDesc",
                    "Import đề IELTS Academic để chúng xuất hiện trong catalog này.",
                  )
                : t(
                    "emptyGeneralDesc",
                    "Import đề IELTS General Training để chúng xuất hiện tại đây.",
                  )
            }
            actionHref="/admin/import"
            actionLabel={t("emptyAction", "Import đề ngay")}
            secondaryHref="/tests"
            secondaryLabel={t("backModulesShort", "Chọn module khác")}
          />
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="card-outline h-48 animate-pulse bg-zinc-100/80"
                />
              ))}
            </div>
          }
        >
          <TestsCatalog tests={catalog} initialSkill={initialSkill} />
        </Suspense>
      )}
    </SiteShell>
  );
}
