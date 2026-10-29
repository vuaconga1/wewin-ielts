"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ClipboardList, ChevronRight, GraduationCap, Loader2, Plus, Search, Users, Video, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";
import { matchesAllWords } from "@/lib/ui/fold-text";

const inputCls =
  "w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";

export type ClassListItem = {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  timezone: string;
  zoomAccountName: string | null;
  studentCount: number;
  teacherCount: number;
  upcomingCount: number;
  homeworkCount: number;
};

export type ZoomAccountOption = { id: string; name: string; isDefault: boolean };

export function ClassesManager({
  classes,
  canManage,
  zoomAccounts,
}: {
  classes: ClassListItem[];
  canManage: boolean;
  zoomAccounts: ZoomAccountOption[];
}) {
  const { t } = useTranslations("classAdmin");
  const { t: tErrors } = useTranslations("errors");
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const timezone = "Asia/Ho_Chi_Minh";
  const [zoomAccountId, setZoomAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const searchParams = useSearchParams();
  const [classQuery, setClassQuery] = useState(() => searchParams.get("q") ?? "");
  const [studentQuery, setStudentQuery] = useState(() => searchParams.get("student") ?? "");
  const [studentMatches, setStudentMatches] = useState<Record<string, string[]> | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState(false);
  const studentTerm = studentQuery.trim();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of [["q", classQuery.trim()], ["student", studentTerm]] as const) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [classQuery, studentTerm]);

  useEffect(() => {
    if (!studentTerm) {
      setStudentMatches(null);
      setStudentError(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStudentLoading(true);
      setStudentError(false);
      try {
        const res = await fetch(`/api/admin/classes/student-search?q=${encodeURIComponent(studentTerm)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { matches: Record<string, string[]> };
        setStudentMatches(data.matches);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.warn("[classes] student search", err);
          setStudentError(true);
        }
      } finally {
        if (!controller.signal.aborted) setStudentLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [studentTerm]);

  const filtering = Boolean(classQuery.trim() || studentTerm);
  const visible = classes.filter(
    (item) =>
      (showArchived || item.status === "ACTIVE") &&
      matchesAllWords(`${item.code} ${item.name}`, classQuery) &&
      (!studentTerm || Boolean(studentMatches?.[item.id])),
  );
  const archivedCount = classes.length - classes.filter((item) => item.status === "ACTIVE").length;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function onShowArchived(val: boolean) {
    setShowArchived(val);
    setPage(1);
  }

  function clearFilters() {
    setClassQuery("");
    setStudentQuery("");
    setPage(1);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, timezone, zoomAccountId: zoomAccountId || null }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        classroom?: { id: string };
      };
      if (!res.ok || !data.classroom) {
        setError(t(`errors.${data.code ?? "generic"}`, t("errors.generic", "Không thực hiện được. Vui lòng thử lại.")));
        return;
      }
      router.push(`/admin/classes/${data.classroom.id}`);
    } catch (err) {
      setError(friendlyError(err, t("errors.generic", "Không thực hiện được. Vui lòng thử lại."), tErrors).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      {canManage ? (
        creating ? (
          <form onSubmit={onCreate} className="card-outline min-w-0 max-w-3xl space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-wewin-navy">{t("createTitle", "Tạo lớp mới")}</h2>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label={t("cancel", "Hủy")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-[12rem_1fr]">
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldCode", "Mã lớp")}</span>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WW00016"
                  pattern="[A-Za-z0-9_\-]{2,40}"
                  className={inputCls}
                />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldName", "Tên lớp")}</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder", "VD: IELTS 6.5 tối 2-4-6")}
                  className={inputCls}
                />
              </label>
            </div>
            <div>
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldZoomAccount", "Tài khoản Zoom")}</span>
                <select value={zoomAccountId} onChange={(e) => setZoomAccountId(e.target.value)} className={inputCls}>
                  <option value="">{t("zoomDefault", "Dùng tài khoản mặc định")}</option>
                  {zoomAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="break-words text-xs text-zinc-500">
              {t("createHint", "Học viên và giáo viên có mã lớp này trong hồ sơ sẽ được thêm vào lớp tự động.")}
            </p>
            {error ? (
              <p role="alert" className="break-words text-sm text-rose-600">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("create", "Tạo lớp")}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            <Plus className="h-4 w-4" />
            {t("createTitle", "Tạo lớp mới")}
          </button>
        )
      ) : null}

      <div className="card-outline min-w-0 space-y-3 p-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="block min-w-0 space-y-1">
            <span className="text-xs font-semibold text-zinc-700">{t("filterClass", "Tìm lớp")}</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                type="search"
                value={classQuery}
                onChange={(e) => {
                  setClassQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t("filterClassPlaceholder", "Mã lớp hoặc tên lớp…")}
                className={`${inputCls} pl-9`}
              />
            </span>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="text-xs font-semibold text-zinc-700">{t("filterStudent", "Tìm theo học viên")}</span>
            <span className="relative block">
              {studentLoading ? (
                <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" aria-hidden />
              ) : (
                <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              )}
              <input
                type="search"
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t("filterStudentPlaceholder", "Tên hoặc username học viên…")}
                className={`${inputCls} pl-9`}
              />
            </span>
          </label>
        </div>
        {filtering ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-zinc-600">
              {studentTerm && studentLoading && !studentMatches
                ? t("filterSearching", "Đang tìm…")
                : t("filterResult", { n: visible.length }, "Tìm thấy {n} lớp")}
            </span>
            {studentError ? (
              <span className="text-rose-600">{t("filterStudentError", "Không tìm được học viên. Thử lại sau.")}</span>
            ) : null}
            <button type="button" onClick={clearFilters} className="font-semibold text-wewin-navy hover:underline">
              {t("filterClear", "Xóa lọc")}
            </button>
          </div>
        ) : null}
      </div>

      {archivedCount > 0 ? (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          {t("showArchived", { n: archivedCount }, "Hiện lớp đã lưu trữ ({n})")}
        </label>
      ) : null}

      {visible.length === 0 ? (
        <div className="break-words rounded-2xl border border-wewin-border bg-white p-8 text-center text-sm text-zinc-600">
          {filtering
            ? studentTerm && (studentLoading || studentError) && !studentMatches
              ? studentError
                ? t("filterStudentError", "Không tìm được học viên. Thử lại sau.")
                : t("filterSearching", "Đang tìm…")
              : t("filterEmpty", "Không có lớp nào khớp bộ lọc.")
            : canManage
              ? t("emptyAdmin", "Chưa có lớp nào. Bấm \"Tạo lớp mới\" để bắt đầu.")
              : t("emptyTeacher", "Chưa có lớp nào.")}
        </div>
      ) : (
        <>
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((item) => (
              <Link
                key={item.id}
                href={`/admin/classes/${item.id}`}
                className="card-outline block min-w-0 p-4 transition hover:border-wewin-navy sm:p-5"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold uppercase tracking-wide text-wewin-blue">
                      {item.code}
                    </p>
                    <h2 className="mt-1 break-words text-lg font-bold text-wewin-navy">{item.name}</h2>
                  </div>
                  {item.status === "ARCHIVED" ? (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                      {t("archived", "Đã lưu trữ")}
                    </span>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
                  <li className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
                    {t("studentCount", { n: item.studentCount }, "{n} học viên")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0" aria-hidden />
                    {t("teacherCount", { n: item.teacherCount }, "{n} giáo viên")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                    {t("upcomingCount", { n: item.upcomingCount }, "{n} buổi sắp tới")}
                  </li>
                  <li className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                    {t("homeworkCount", { n: item.homeworkCount }, "{n} bài tập")}
                  </li>
                  <li className="flex min-w-0 items-center gap-2">
                    <Video className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 break-words">
                      {item.zoomAccountName ?? t("zoomDefault", "Dùng tài khoản mặc định")}
                    </span>
                  </li>
                </ul>
                {studentTerm && studentMatches?.[item.id]?.length ? (
                  <p className="mt-3 break-words rounded-lg bg-wewin-accent-blue-bg px-2.5 py-1.5 text-xs text-wewin-navy">
                    {t("filterMatched", { names: studentMatches[item.id].join(", ") }, "Học viên khớp: {names}")}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-zinc-600">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
