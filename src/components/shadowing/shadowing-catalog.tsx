"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { learnCatalogHref, learnShadowingHref } from "@/lib/learn/hrefs";
import type { ShadowingCatalogItem } from "@/lib/shadowing/types";
import { useTranslations } from "@/i18n/provider";

export function ShadowingCatalog({ items }: { items: ShadowingCatalogItem[] }) {
  const { t } = useTranslations("shadowing");

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link href={learnCatalogHref()} className="text-sm font-medium text-wewin-navy hover:underline">
          {t("backLearn", "← Học")}
        </Link>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {t("catalogTitle", "Shadowing — Nghe và đọc lại")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t(
            "catalogDesc",
            "Nghe câu mẫu, ghi âm giọng đọc của bạn và xem hệ thống nhận diện khớp với câu mẫu đến đâu.",
          )}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="wewin-card-3d border-dashed px-6 py-10 text-center">
          <p className="font-semibold text-zinc-800">{t("emptyTitle", "Chưa có bài Shadowing")}</p>
          <p className="mt-1 text-sm text-zinc-600">{t("emptyDesc", "Nội dung sẽ được cập nhật sớm.")}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link
                href={learnShadowingHref(item.slug)}
                prefetch={false}
                className="card-outline-hover group flex h-full min-w-0 items-center gap-3 border-zinc-300 px-4 py-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wewin-accent-blue-bg text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                  <Mic className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold text-zinc-900">{item.title}</span>
                  {item.level ? (
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {t("level", { level: item.level }, "Trình độ {level}")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs font-bold text-wewin-navy">{t("start", "Luyện →")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
