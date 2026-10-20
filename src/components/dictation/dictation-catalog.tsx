"use client";

import Link from "next/link";
import { Headphones, TextCursorInput } from "lucide-react";
import { learnCatalogHref, learnListeningExerciseHref } from "@/lib/learn/hrefs";
import type { DictationCatalogItem, DictationMode } from "@/lib/dictation/types";
import { useTranslations } from "@/i18n/provider";

type Props = { items: DictationCatalogItem[]; mode: DictationMode };

export function DictationCatalog({ items, mode }: Props) {
  const { t } = useTranslations("dictation");
  const fill = mode === "FILL_BLANK";
  const Icon = fill ? TextCursorInput : Headphones;

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={learnCatalogHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backLearn", "← Học")}
        </Link>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {fill
            ? t("fillCatalogTitle", "Nghe điền từ")
            : t("catalogTitle", "Nghe chép chính tả")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {fill
            ? t(
                "fillCatalogDesc",
                "Nghe audio, đọc transcript bị ẩn một số từ và điền phần còn thiếu vào từng ô trống.",
              )
            : t(
                "catalogDesc",
                "Nghe audio ngắn, gõ lại nội dung rồi bấm Kiểm tra để xem lỗi theo từng từ.",
              )}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="wewin-card-3d border-dashed px-6 py-10 text-center">
          <p className="font-semibold text-zinc-800">
            {fill
              ? t("fillEmptyTitle", "Chưa có bài nghe điền từ")
              : t("emptyTitle", "Chưa có bài chép chính tả")}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {t("emptyDesc", "Nội dung sẽ được cập nhật sớm.")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link
                href={learnListeningExerciseHref(mode, item.slug)}
                prefetch={false}
                className="card-outline-hover group flex h-full min-w-0 items-center gap-3 border-zinc-300 px-4 py-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wewin-accent-blue-bg text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold text-zinc-900">
                    {item.title}
                  </span>
                  {item.level ? (
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {t("level", { level: item.level }, "Trình độ {level}")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs font-bold text-wewin-navy">
                  {t("start", "Làm bài →")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
