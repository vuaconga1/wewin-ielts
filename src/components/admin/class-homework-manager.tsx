"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { utcToZonedWallTime } from "@/lib/classroom/schedule-time";
import type { HomeworkSkill } from "@/lib/classroom/homework-core";
import type {
  ClassAssignmentView,
  ClassProgress,
  HomeworkCatalogTest,
} from "@/lib/classroom/homework";
import { friendlyError } from "@/lib/ui/friendly-error";

const inputCls =
  "w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";
const secondaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60";
const dangerBtn = `${secondaryBtn} border-rose-200 text-rose-600 hover:bg-rose-50`;

const SKILLS: HomeworkSkill[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];
const EXAM_ORDER = ["ACADEMIC", "GENERAL", "PLACEMENT"];

type Notice = { kind: "ok" | "error"; text: string } | null;
type DraftRow = { key: number; skill: HomeworkSkill | ""; slug: string; parts: number[]; deadline: string };

let rowSeq = 0;

export function ClassHomeworkManager({
  classroomId,
  timezone,
  archived,
  initialAssignments,
}: {
  classroomId: string;
  timezone: string;
  archived: boolean;
  initialAssignments: ClassAssignmentView[];
}) {
  const { t, locale } = useTranslations("classHomework");
  const { t: tSkills } = useTranslations("skills");
  const { t: tExam } = useTranslations("examTypes");
  const { t: tErrors } = useTranslations("errors");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
        timeZone: timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
    [locale, timezone],
  );
  const fmt = (iso: string) => dateFormatter.format(new Date(iso));

  function errorText(code: string | undefined, raw?: unknown) {
    const generic = t("errors.generic", "Không thực hiện được. Vui lòng thử lại.");
    if (code) return t(`errors.${code}`, generic);
    return friendlyError(raw, generic, tErrors).message;
  }

  async function call<T>(key: string, url: string, method: string, body?: unknown): Promise<T | null> {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => null)) as (T & { code?: string }) | null;
      if (!res.ok || !data) {
        setNotice({ kind: "error", text: errorText(data?.code, data ? undefined : "invalid response") });
        return null;
      }
      return data;
    } catch (error) {
      setNotice({ kind: "error", text: errorText(undefined, error) });
      return null;
    } finally {
      setBusy(null);
    }
  }

  // ---------- Progress ----------
  const [progress, setProgress] = useState<ClassProgress | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    setProgressLoading(true);
    setProgressError(false);
    try {
      const res = await fetch(`/api/admin/classes/${classroomId}/progress`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setProgress((await res.json()) as ClassProgress);
    } catch {
      setProgressError(true);
    } finally {
      setProgressLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  // ---------- Catalog + assign form ----------
  const [catalog, setCatalog] = useState<HomeworkCatalogTest[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const defaultDeadline = useCallback(
    () => utcToZonedWallTime(new Date(Date.now() + 7 * 86_400_000), timezone),
    [timezone],
  );
  const newRow = useCallback(
    (): DraftRow => ({ key: ++rowSeq, skill: "", slug: "", parts: [], deadline: defaultDeadline() }),
    [defaultDeadline],
  );
  const [rows, setRows] = useState<DraftRow[]>([]);

  async function openForm() {
    setShowForm(true);
    if (!rows.length) setRows([newRow()]);
    if (catalog) return;
    setCatalogError(false);
    try {
      const res = await fetch("/api/admin/classes/catalog");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: HomeworkCatalogTest[] };
      setCatalog(data.items);
    } catch {
      setCatalogError(true);
    }
  }

  const testsBySlug = useMemo(
    () => new Map((catalog ?? []).map((test) => [test.slug, test])),
    [catalog],
  );

  function testsForSkill(skill: HomeworkSkill | "") {
    if (!skill || !catalog) return [];
    const list = catalog.filter((test) => test.skill === skill);
    return EXAM_ORDER.map((exam) => ({
      exam,
      tests: list.filter((test) => test.examType === exam),
    })).filter((group) => group.tests.length);
  }

  function patchRow(key: number, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function togglePart(row: DraftRow, order: number) {
    patchRow(row.key, {
      parts: row.parts.includes(order) ? row.parts.filter((o) => o !== order) : [...row.parts, order],
    });
  }

  async function submitAssignments(e: React.FormEvent) {
    e.preventDefault();
    const complete = rows.filter((row) => row.slug && row.deadline);
    if (!complete.length) {
      setNotice({
        kind: "error",
        text: t("pickAtLeastOne", "Chọn ít nhất một bài đầy đủ (kỹ năng → đề → hạn nộp)."),
      });
      return;
    }
    const data = await call<{ items: ClassAssignmentView[] }>(
      "assign",
      `/api/admin/classes/${classroomId}/assignments`,
      "POST",
      {
        assignments: complete.map((row) => ({
          testSlug: row.slug,
          sectionOrders: row.parts,
          deadlineWallTime: row.deadline,
        })),
      },
    );
    if (!data) return;
    setAssignments((prev) =>
      [...prev, ...data.items].sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt)),
    );
    setRows([newRow()]);
    setShowForm(false);
    setNotice({ kind: "ok", text: t("assigned", { n: data.items.length }, "Đã giao {n} bài tập.") });
    void loadProgress();
  }

  // ---------- Edit deadline / delete ----------
  const [editing, setEditing] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState("");

  async function saveDeadline(assignment: ClassAssignmentView) {
    const data = await call<{ item: ClassAssignmentView }>(
      `save:${assignment.id}`,
      `/api/admin/classes/${classroomId}/assignments/${assignment.id}`,
      "PATCH",
      { deadlineWallTime: editDeadline },
    );
    if (!data) return;
    setAssignments((prev) =>
      prev
        .map((item) => (item.id === assignment.id ? data.item : item))
        .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt)),
    );
    setEditing(null);
    setNotice({ kind: "ok", text: t("deadlineSaved", "Đã cập nhật hạn nộp.") });
    void loadProgress();
  }

  async function removeAssignment(assignment: ClassAssignmentView) {
    if (!window.confirm(t("confirmDelete", { title: assignment.testTitle }, "Xóa bài tập “{title}” khỏi lớp?"))) return;
    const data = await call<{ ok: boolean }>(
      `delete:${assignment.id}`,
      `/api/admin/classes/${classroomId}/assignments/${assignment.id}`,
      "DELETE",
    );
    if (!data) return;
    setAssignments((prev) => prev.filter((item) => item.id !== assignment.id));
    setNotice({ kind: "ok", text: t("deleted", "Đã xóa bài tập.") });
    void loadProgress();
  }

  function assignmentTitle(item: Pick<ClassAssignmentView, "testTitle" | "partLabel" | "skill">) {
    return (
      <>
        <span className="font-semibold text-wewin-navy">{item.testTitle}</span>
        <span className="text-zinc-500">
          {" · "}
          {tSkills(item.skill, item.skill)}
          {" · "}
          {item.partLabel ?? t("wholeTest", "Cả đề")}
        </span>
      </>
    );
  }

  function testHref(item: ClassAssignmentView) {
    return `/tests/${encodeURIComponent(item.testSlug)}`;
  }

  return (
    <section className="card-outline min-w-0 space-y-5 p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-wewin-navy">
            <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
            {t("title", "Bài tập về nhà")}
          </h2>
          <p className="mt-0.5 break-words text-xs text-zinc-500">
            {t("timezoneNote", { tz: timezone }, "Hạn nộp theo múi giờ của lớp: {tz}")}
          </p>
        </div>
        {!archived && !showForm ? (
          <button type="button" onClick={() => void openForm()} className={primaryBtn}>
            <Plus className="h-4 w-4" />
            {t("assignButton", "Giao bài tập")}
          </button>
        ) : null}
      </div>

      {notice ? (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`min-w-0 break-words rounded-xl border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={submitAssignments}
          className="min-w-0 space-y-3 rounded-xl border border-wewin-border bg-wewin-bg/40 p-3 sm:p-4"
        >
          {catalogError ? (
            <p className="text-sm text-rose-600">{t("catalogError", "Không tải được danh sách đề. Thử lại sau.")}</p>
          ) : !catalog ? (
            <p className="inline-flex items-center gap-2 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("catalogLoading", "Đang tải danh sách đề…")}
            </p>
          ) : (
            rows.map((row, index) => {
              const test = row.slug ? testsBySlug.get(row.slug) : undefined;
              const canPickParts = test && test.skill !== "SPEAKING" && test.parts.length > 1;
              return (
                <div key={row.key} className="min-w-0 space-y-3 rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,13rem)]">
                    <label className="block min-w-0 space-y-1">
                      <span className="text-xs font-semibold text-zinc-700">{t("fieldSkill", "Kỹ năng")}</span>
                      <select
                        value={row.skill}
                        onChange={(e) =>
                          patchRow(row.key, { skill: e.target.value as HomeworkSkill | "", slug: "", parts: [] })
                        }
                        className={inputCls}
                      >
                        <option value="">{t("pickSkill", "Chọn kỹ năng…")}</option>
                        {SKILLS.map((skill) => (
                          <option key={skill} value={skill}>
                            {tSkills(skill, skill)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0 space-y-1">
                      <span className="text-xs font-semibold text-zinc-700">{t("fieldTest", "Đề")}</span>
                      <select
                        value={row.slug}
                        disabled={!row.skill}
                        onChange={(e) => patchRow(row.key, { slug: e.target.value, parts: [] })}
                        className={inputCls}
                      >
                        <option value="">{t("pickTest", "Chọn đề…")}</option>
                        {testsForSkill(row.skill).map((group) => (
                          <optgroup key={group.exam} label={tExam(group.exam, group.exam)}>
                            {group.tests.map((item) => (
                              <option key={item.slug} value={item.slug}>
                                {item.title}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0 space-y-1">
                      <span className="text-xs font-semibold text-zinc-700">{t("fieldDeadline", "Hạn nộp")}</span>
                      <input
                        type="datetime-local"
                        value={row.deadline}
                        onChange={(e) => patchRow(row.key, { deadline: e.target.value })}
                        className={inputCls}
                      />
                    </label>
                  </div>
                  {canPickParts ? (
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-xs font-semibold text-zinc-700">
                        {t("fieldParts", "Phần (bỏ trống = cả đề)")}
                      </p>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        {test.parts.map((part) => {
                          const on = row.parts.includes(part.order);
                          return (
                            <button
                              key={part.order}
                              type="button"
                              aria-pressed={on}
                              onClick={() => togglePart(row, part.order)}
                              className={`min-h-9 max-w-full break-words rounded-xl border px-3 py-1.5 text-left text-xs font-semibold ${
                                on
                                  ? "border-wewin-navy bg-wewin-navy text-white"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                              }`}
                            >
                              {part.title}
                              <span className={on ? "text-white/80" : "text-zinc-400"}>
                                {" "}
                                · {t("questionCount", { n: part.questionCount }, "{n} câu")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((item) => item.key !== row.key))}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("removeRow", { n: index + 1 }, "Xóa dòng {n}")}
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, newRow()])}
              disabled={!catalog}
              className={secondaryBtn}
            >
              <Plus className="h-4 w-4" />
              {t("addRow", "Thêm bài tập")}
            </button>
            <button type="submit" disabled={busy !== null || !catalog} className={primaryBtn}>
              {busy === "assign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("submitAssign", "Giao bài đã chọn")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={secondaryBtn}>
              {t("cancel", "Hủy")}
            </button>
          </div>
        </form>
      ) : null}

      {/* Assigned list */}
      {assignments.length ? (
        <ul className="min-w-0 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {assignments.map((item) => {
            const overdue = new Date(item.deadlineAt).getTime() < Date.now();
            return (
              <li key={item.id} className="flex min-w-0 flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm">{assignmentTitle(item)}</p>
                  {editing === item.id ? (
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                      <input
                        type="datetime-local"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className={`${inputCls} sm:w-56`}
                        aria-label={t("fieldDeadline", "Hạn nộp")}
                      />
                      <button type="button" onClick={() => void saveDeadline(item)} disabled={busy !== null} className={secondaryBtn}>
                        {busy === `save:${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {t("save", "Lưu")}
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className={secondaryBtn}>
                        {t("cancel", "Hủy")}
                      </button>
                    </div>
                  ) : (
                    <p className={`mt-0.5 text-xs ${overdue ? "text-rose-600" : "text-zinc-500"}`}>
                      {t("deadlineLabel", "Hạn nộp")}: {fmt(item.deadlineAt)}
                      {" · "}
                      {t("questionCount", { n: item.questionCount }, "{n} câu")}
                    </p>
                  )}
                </div>
                {editing !== item.id ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={testHref(item)} className={secondaryBtn} title={t("openTest", "Mở đề")}>
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">{t("openTest", "Mở đề")}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(item.id);
                        setEditDeadline(utcToZonedWallTime(new Date(item.deadlineAt), timezone));
                      }}
                      disabled={busy !== null}
                      className={secondaryBtn}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("editDeadline", "Sửa hạn")}
                    </button>
                    <button type="button" onClick={() => void removeAssignment(item)} disabled={busy !== null} className={dangerBtn}>
                      {busy === `delete:${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {t("delete", "Xóa")}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600">{t("noAssignments", "Chưa có bài tập được giao.")}</p>
      )}

      {/* Progress */}
      <div className="min-w-0 space-y-3 border-t border-zinc-100 pt-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-wewin-navy">{t("progressTitle", "Tiến độ bài tập")}</h3>
            <p className="break-words text-xs text-zinc-500">
              {t(
                "progressNote",
                "Chỉ tính các lần nộp bài sau khi giao, làm đủ các phần được giao. Tiến độ có thể chậm tối đa 1 phút.",
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => void loadProgress()} disabled={progressLoading} className={secondaryBtn}>
              <RefreshCw className={`h-4 w-4 ${progressLoading ? "animate-spin" : ""}`} />
              <span className="sr-only sm:not-sr-only">{t("refresh", "Tải lại")}</span>
            </button>
            {progress && progress.studentCount > 0 && progress.assignments.length > 0 ? (
              <a href={`/api/admin/classes/${classroomId}/export`} className={secondaryBtn}>
                <Download className="h-4 w-4" />
                {t("exportCsv", "Xuất CSV")}
              </a>
            ) : null}
          </div>
        </div>

        {progressLoading && !progress ? (
          <p className="inline-flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("progressLoading", "Đang tải tiến độ…")}
          </p>
        ) : progressError && !progress ? (
          <p className="text-sm text-rose-600">{t("progressError", "Không tải được tiến độ. Bấm Tải lại để thử lại.")}</p>
        ) : !progress || progress.studentCount === 0 ? (
          <p className="text-sm text-zinc-600">{t("progressNoStudents", "Thêm học viên và giao bài để xem tiến độ.")}</p>
        ) : !progress.assignments.length ? (
          <p className="text-sm text-zinc-600">{t("noAssignments", "Chưa có bài tập được giao.")}</p>
        ) : (
          <div className="min-w-0 space-y-4">
            {progress.assignments.map((item) => {
              const done = item.rows.filter((row) => row.status === "done").length;
              return (
                <div key={item.id} className="min-w-0 rounded-xl border border-zinc-200">
                  <div className="min-w-0 border-b border-zinc-100 bg-zinc-50/70 px-3 py-2">
                    <p className="break-words text-sm">{assignmentTitle(item)}</p>
                    <p className="text-xs text-zinc-500">
                      {t("deadlineLabel", "Hạn nộp")}: {fmt(item.deadlineAt)} ·{" "}
                      {t("doneCount", { done, total: item.rows.length }, "{done}/{total} học viên đã làm")}
                    </p>
                  </div>
                  <div className="min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[40rem] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">{t("colStudent", "Học viên")}</th>
                          <th className="px-3 py-2 font-semibold">{t("colStatus", "Trạng thái")}</th>
                          <th className="px-3 py-2 font-semibold">{t("colCorrect", "Đúng")}</th>
                          <th className="px-3 py-2 font-semibold">{t("colBand", "Band")}</th>
                          <th className="px-3 py-2 font-semibold">{t("colAttempts", "Số lần làm")}</th>
                          <th className="px-3 py-2 font-semibold">{t("colSubmittedAt", "Thời gian nộp")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {item.rows.map((row) => (
                          <tr key={row.userId}>
                            <td className="px-3 py-2">
                              <p className="break-words font-medium text-zinc-900">{row.name}</p>
                              <p className="text-xs text-zinc-500">{row.username}</p>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  row.status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {row.status === "done" ? t("statusDone", "Đã làm") : t("statusPending", "Chưa làm")}
                              </span>
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              {row.correct !== null && row.total ? `${row.correct}/${row.total}` : "—"}
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              {row.band !== null ? (
                                row.bestAttemptId ? (
                                  <Link
                                    href={`/practice/${encodeURIComponent(item.testSlug)}/${row.bestAttemptId}/result`}
                                    className="font-semibold text-wewin-navy hover:underline"
                                    title={t("viewBest", "Xem bài làm tốt nhất")}
                                  >
                                    {row.band.toFixed(1)}
                                  </Link>
                                ) : (
                                  row.band.toFixed(1)
                                )
                              ) : row.status === "done" && (item.skill === "WRITING" || item.skill === "SPEAKING") ? (
                                <span className="text-xs text-zinc-500">{t("notScored", "Chưa chấm")}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3 py-2 tabular-nums">{row.attemptCount}</td>
                            <td className="px-3 py-2">
                              {row.submittedAt ? (
                                <span className={row.isLate ? "text-rose-600" : "text-emerald-700"}>
                                  {fmt(row.submittedAt)}
                                  <span className="block text-xs">
                                    {row.isLate ? t("late", "Trễ hạn") : t("onTime", "Đúng hạn")}
                                  </span>
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
