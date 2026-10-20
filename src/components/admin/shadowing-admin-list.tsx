"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { learnShadowingHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

export type ShadowingAdminListRow = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  order: number;
  attempts: number;
};

export function ShadowingAdminList({ rows }: { rows: ShadowingAdminListRow[] }) {
  const { t } = useTranslations("shadowingAdmin");
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!window.confirm(t("confirmDelete", "Xóa bài này cùng toàn bộ kết quả và bản ghi âm?"))) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shadowing/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(t("errors.deleteFailed", "Không xóa được bài. Thử lại."));
        return;
      }
      router.refresh();
    } catch {
      setError(t("errors.deleteFailed", "Không xóa được bài. Thử lại."));
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="wewin-card-3d border-dashed px-6 py-10 text-center text-sm text-zinc-600">
        {t("empty", "Chưa có bài nào.")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-zinc-900">{row.title}</p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span>
                  {t("colOrder", "Thứ tự")}: {row.order}
                </span>
                {row.level ? (
                  <span>
                    {t("colLevel", "Trình độ")}: {row.level}
                  </span>
                ) : null}
                <span>
                  {t("colStatus", "Trạng thái")}: {t(`status.${row.status}`)}
                </span>
                <span>
                  {t("colAttempts", "Lượt nộp")}: {row.attempts}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-sm">
              {row.status === "PUBLISHED" ? (
                <Link
                  href={learnShadowingHref(row.slug)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {t("view", "Xem")}
                </Link>
              ) : null}
              <Link
                href={`/admin/shadowing/${row.id}`}
                className="rounded-lg bg-wewin-navy px-3 py-1.5 font-semibold text-white hover:bg-wewin-navy-hover"
              >
                {t("edit", "Sửa / Bài nộp")}
              </Link>
              <button
                type="button"
                onClick={() => void onDelete(row.id)}
                disabled={busyId === row.id}
                className="rounded-lg border border-rose-200 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                {t("delete", "Xóa")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
