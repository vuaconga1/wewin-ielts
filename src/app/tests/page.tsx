import Link from "next/link";
import { listPublicTests } from "@/lib/store/test-store";
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
  const tests = await listPublicTests();
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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{t("tests.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 sm:text-base">
          {t("tests.subtitle")}
        </p>
   
      </div>

      <TestsModulePicker
        academicCount={academicCount}
        generalCount={generalCount}
        placementCount={placementCount}
      />

      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-wewin-navy">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-wewin-accent-blue-bg text-wewin-navy text-xs">
            💡
          </span>
          {t("tests.guideTitle", "Hướng dẫn luyện đề IELTS hiệu quả")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h3 className="text-xs font-bold text-wewin-navy">{t("tests.guideStep1Title", "1. Chọn Module phù hợp")}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              {t("tests.guideStep1Desc", "Chọn Academic để xét tuyển đại học / du học, General Training để định cư & làm việc, hoặc Placement Test để kiểm tra trình độ khởi điểm.")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h3 className="text-xs font-bold text-wewin-navy">{t("tests.guideStep2Title", "2. Luyện tập có bấm giờ")}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              {t("tests.guideStep2Desc", "Rèn luyện từng kỹ năng Nghe, Đọc, Viết, Nói hoặc làm Full Test có đếm ngược thời gian để làm quen với áp lực phòng thi thực tế.")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h3 className="text-xs font-bold text-wewin-navy">{t("tests.guideStep3Title", "3. Đối chiếu và phân tích")}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              {t("tests.guideStep3Desc", "Xem giải thích đáp án chi tiết, nhận diện điểm yếu cần cải thiện và theo dõi tiến độ điểm số trong mục Lịch sử làm bài.")}
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
