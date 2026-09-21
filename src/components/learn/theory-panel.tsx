"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  theoryHtml: string;
  slidesHtml?: string;
  stub?: boolean;
};

export function TheoryPanel({ theoryHtml, slidesHtml, stub }: Props) {
  const { t } = useTranslations("learn");
  const [slidesOpen, setSlidesOpen] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
          {t("theoryTitle", "Lý thuyết")}
        </h2>
        {stub ? (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            {t("contentComingSoon", "Nội dung đang cập nhật")}
          </span>
        ) : null}
      </div>

      {slidesHtml ? (
        <button
          type="button"
          onClick={() => setSlidesOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-sm font-medium text-wewin-navy hover:underline"
        >
          {slidesOpen
            ? t("hideSlides", "Ẩn slides bài giảng")
            : t("showSlides", "Hiển thị slides bài giảng")}
          {slidesOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      ) : null}

      {slidesOpen && slidesHtml ? (
        <div
          className="learn-theory card-outline p-4 sm:p-5"
          dangerouslySetInnerHTML={{ __html: slidesHtml }}
        />
      ) : null}

      <div
        className="learn-theory card-outline p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: theoryHtml }}
      />
    </section>
  );
}
