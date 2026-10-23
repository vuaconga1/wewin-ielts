"use client";

import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { useTranslations } from "@/i18n/provider";

export default function LearnError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslations("errorPage");

  return (
    <SiteShell active="learn">
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="break-words text-2xl font-bold text-zinc-900">
          {t("title", "Không tải được nội dung")}
        </h1>
        <p className="mt-3 break-words text-sm text-zinc-600">
          {t("desc", "Máy chủ đang bận hoặc mất kết nối tạm thời. Vui lòng thử lại sau vài giây.")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-lg bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t("retry", "Thử lại")}
          </button>
          <Link
            href="/learn"
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t("backLearn", "Về trang học")}
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
