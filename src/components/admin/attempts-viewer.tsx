"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import type {
  AdminAttemptRow,
  AdminAttemptSkill,
  AdminClassOption,
  AdminTestOption,
  AdminUserOption,
} from "@/lib/admin/attempts";
import {
  attemptDurationSeconds,
  combineTestAttempts,
  partNumbers,
  type CombinedTestResult,
} from "@/lib/admin/test-progress";
import { localeToIntl } from "@/i18n/config";
import type { Translator as Translate } from "@/i18n/translate";
import { useTranslations } from "@/i18n/provider";
import { PaginationControls } from "@/components/ui/pagination";
import { UserCombobox } from "@/components/admin/user-combobox";

type FiltersState = {
  userId: string;
  classId: string;
  skill: "ALL" | AdminAttemptSkill;
  testSlug: string;
  status: "ALL" | "FINISHED" | "UNFINISHED";
  from: string;
  to: string;
};

const EMPTY_FILTERS: FiltersState = {
  userId: "",
  classId: "",
  skill: "ALL",
  testSlug: "",
  status: "ALL",
  from: "",
  to: "",
};

type ApiResponse = {
  attempts: AdminAttemptRow[];
  users: AdminUserOption[];
  tests: AdminTestOption[];
  classes: AdminClassOption[];
  total: number;
  source: "prisma" | "local" | "mixed";
  error?: string;
};

type ViewMode = "grouped" | "attempts";

type AttemptGroup = {
  key: string;
  head: AdminAttemptRow;
  rows: AdminAttemptRow[];
  combined: CombinedTestResult;
};

function formatDuration(seconds: number | null, t: Translate, dash: string) {
  if (seconds == null || seconds <= 0) return dash;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(t("durationH", { n: h }));
  if (m > 0) parts.push(t("durationM", { n: m }));
  if (s > 0 && h === 0) parts.push(t("durationS", { n: s }));
  return parts.join(" ") || t("durationS", { n: 0 });
}

function sectionsLabel(
  orders: number[],
  testSectionOrders: number[],
  skill: string | null,
  t: Translate,
): string {
  if (!orders.length) return t("wholeTest");
  const list = partNumbers(orders, testSectionOrders).join(", ");
  return skill === "READING"
    ? t("passageList", { list })
    : t("partList", { list });
}

function skillBadgeClass(skill: string | null) {
  switch (skill) {
    case "LISTENING":
      return "bg-wewin-accent-blue-bg text-wewin-navy";
    case "READING":
      return "bg-wewin-bg text-wewin-navy ring-1 ring-wewin-navy/15";
    case "WRITING":
      return "bg-white text-wewin-navy ring-1 ring-wewin-navy/25";
    case "SPEAKING":
      return "bg-wewin-navy/10 text-wewin-navy";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

export function AttemptsViewer({
  initialUserId = "",
}: {
  initialUserId?: string;
}) {
  const { t, locale } = useTranslations("attemptsAdmin");
  const { t: ts } = useTranslations("skills");
  const { t: tm } = useTranslations("attemptModes");
  const { t: tc } = useTranslations("common");
  const intlLocale = localeToIntl(locale);
  const initialFilters = { ...EMPTY_FILTERS, userId: initialUserId };
  const [draft, setDraft] = useState<FiltersState>(initialFilters);
  const [applied, setApplied] = useState<FiltersState>(initialFilters);
  const [view, setView] = useState<ViewMode>("grouped");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [attempts, setAttempts] = useState<AdminAttemptRow[]>([]);
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [tests, setTests] = useState<AdminTestOption[]>([]);
  const [classes, setClasses] = useState<AdminClassOption[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<"prisma" | "local" | "mixed" | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const sectionsBySlug = useMemo(
    () => new Map(tests.map((x) => [x.slug, x.sectionOrders ?? []])),
    [tests],
  );

  const groups = useMemo<AttemptGroup[]>(() => {
    const byKey = new Map<string, AdminAttemptRow[]>();
    for (const row of attempts) {
      const key = row.userId
        ? `${row.userId}|${row.testSlug}`
        : `guest|${row.id}`;
      const list = byKey.get(key);
      if (list) list.push(row);
      else byKey.set(key, [row]);
    }
    const out: AttemptGroup[] = [];
    for (const [key, rows] of byKey) {
      const head = rows[0]!;
      const combined = combineTestAttempts(
        rows,
        head.skill,
        sectionsBySlug.get(head.testSlug) ?? [],
      );
      if (combined) out.push({ key, head, rows, combined });
    }
    return out.sort((a, b) =>
      a.combined.lastActivityAt < b.combined.lastActivityAt ? 1 : -1,
    );
  }, [attempts, sectionsBySlug]);

  const itemCount = view === "grouped" ? groups.length : attempts.length;
  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageAttempts = attempts.slice(pageStart, pageStart + pageSize);
  const pageGroups = groups.slice(pageStart, pageStart + pageSize);

  function toggleGroup(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function changeView(next: ViewMode) {
    setView(next);
    setPage(1);
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString(intlLocale);
  const dash = tc("dash");
  const isAiSkill = (skill: string | null) =>
    skill === "WRITING" || skill === "SPEAKING";

  function renderLearner(row: AdminAttemptRow) {
    const name = row.userFullName || row.username || dash;
    return (
      <>
        {row.userId ? (
          <Link
            href={`/admin/reports/${row.userId}`}
            className="block break-words font-medium text-wewin-navy hover:underline"
            title={t("learnerHistoryHint")}
          >
            {name}
          </Link>
        ) : (
          <div className="break-words font-medium text-zinc-900">{name}</div>
        )}
        <div className="break-all text-xs text-zinc-500">
          {row.userFullName && row.username ? (
            <span className="font-mono text-zinc-400">{row.username} · </span>
          ) : null}
          {row.userEmail ?? (row.userId ? t("learner") : t("guestUser"))}
        </div>
      </>
    );
  }

  function renderTest(row: AdminAttemptRow) {
    return (
      <>
        <div className="break-words font-medium text-zinc-900">
          {row.testTitle}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {row.skill ? (
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${skillBadgeClass(row.skill)}`}
            >
              {ts(row.skill, row.skill)}
            </span>
          ) : null}
          <span className="break-all text-xs text-zinc-400">{row.testSlug}</span>
        </div>
      </>
    );
  }

  function renderAttemptScope(row: AdminAttemptRow) {
    if (isAiSkill(row.skill)) return null;
    return (
      <span className="text-zinc-600">
        {sectionsLabel(
          row.sectionOrders,
          sectionsBySlug.get(row.testSlug) ?? [],
          row.skill,
          t,
        )}
        {row.partial ? ` · ${t("redoWrong")}` : ""}
      </span>
    );
  }

  function renderAttemptScore(row: AdminAttemptRow) {
    if (row.status !== "FINISHED") {
      return <span className="text-wewin-navy/70">{t("inProgress")}</span>;
    }
    if (
      !isAiSkill(row.skill) &&
      row.scoreCorrect != null &&
      row.scoreTotal != null
    ) {
      return (
        <span className="text-zinc-900">
          {row.scoreCorrect}/{row.scoreTotal}
          {row.scoreTotal > 0 ? (
            <span className="ml-1 text-xs text-zinc-500">
              ({Math.round((row.scoreCorrect / row.scoreTotal) * 100)}%)
            </span>
          ) : null}
        </span>
      );
    }
    if (row.scoreBand != null) {
      return (
        <span className="text-zinc-900">
          {t("bandLabel", { band: row.scoreBand })}
        </span>
      );
    }
    if (row.scoreLabel) {
      return <span className="text-zinc-900">{row.scoreLabel}</span>;
    }
    return <span className="text-zinc-400">{dash}</span>;
  }

  function renderCombined(head: AdminAttemptRow, combined: CombinedTestResult) {
    if (combined.correct != null && combined.total != null) {
      return (
        <div className="space-y-0.5">
          <div className="text-base font-bold text-wewin-navy">
            {t("correctOf", { correct: combined.correct, total: combined.total })}
          </div>
          <div className="text-xs text-zinc-600">
            {combined.percent != null ? `${combined.percent}%` : ""}
            {combined.band != null
              ? ` · ${t("bandLabel", { band: combined.band })}`
              : ""}
          </div>
          {combined.sectionCount > 0 ? (
            <div
              className={`text-xs ${combined.complete ? "text-emerald-700" : "text-amber-700"}`}
            >
              {combined.complete
                ? t("partsComplete", { all: combined.sectionCount })
                : t("partsDone", {
                    done: combined.sectionsCovered.length,
                    all: combined.sectionCount,
                  })}
              {!combined.complete && combined.sectionsCovered.length
                ? ` (${sectionsLabel(
                    combined.sectionsCovered,
                    sectionsBySlug.get(head.testSlug) ?? [],
                    head.skill,
                    t,
                  )})`
                : ""}
            </div>
          ) : null}
        </div>
      );
    }
    if (combined.band != null) {
      return (
        <div className="text-base font-bold text-wewin-navy">
          {t("bandLabel", { band: combined.band })}
        </div>
      );
    }
    if (combined.finishedAttempts === 0) {
      return <span className="text-wewin-navy/70">{t("inProgress")}</span>;
    }
    return <span className="text-zinc-400">{t("noScoreYet")}</span>;
  }

  const skillOptions = useMemo(
    () =>
      [
        { value: "ALL" as const, label: t("allSkills") },
        { value: "LISTENING" as const, label: ts("LISTENING") },
        { value: "READING" as const, label: ts("READING") },
        { value: "WRITING" as const, label: ts("WRITING") },
        { value: "SPEAKING" as const, label: ts("SPEAKING") },
      ] satisfies { value: "ALL" | AdminAttemptSkill; label: string }[],
    [t, ts],
  );

  const statusOptions = useMemo(
    () =>
      [
        { value: "ALL" as const, label: t("allStatuses") },
        { value: "FINISHED" as const, label: t("finished") },
        { value: "UNFINISHED" as const, label: t("inProgress") },
      ] satisfies {
        value: "ALL" | "FINISHED" | "UNFINISHED";
        label: string;
      }[],
    [t],
  );

  const sourceLabel =
    source === "mixed"
      ? t("sourceDbLocal")
      : source === "prisma"
        ? t("sourcePrisma")
        : source === "local"
          ? t("sourceLocal")
          : null;

  const load = useCallback(async (filters: FiltersState) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.classId) params.set("classId", filters.classId);
      if (filters.skill !== "ALL") params.set("skill", filters.skill);
      if (filters.testSlug) params.set("testSlug", filters.testSlug);
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      params.set("limit", "200");

      const res = await fetch(`/api/admin/attempts?${params.toString()}`);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(data.error ?? t("loadFailed"));
        setAttempts([]);
        setTotal(0);
        return;
      }
      setAttempts(
        data.attempts.map((row) => ({
          ...row,
          sectionOrders: row.sectionOrders ?? [],
          partial: row.partial ?? false,
          scoreCorrect: row.scoreCorrect ?? null,
          scoreTotal: row.scoreTotal ?? null,
        })),
      );
      setPage(1);
      setUsers(data.users);
      setTests(data.tests ?? []);
      setClasses(data.classes ?? []);
      setTotal(data.total);
      setSource(data.source);
    } catch {
      setError(t("networkRetry"));
      setAttempts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(applied);
  }, [applied, load]);

  const testOptions = useMemo(() => {
    if (draft.skill === "ALL") return tests;
    return tests.filter((t) => t.skill === draft.skill);
  }, [tests, draft.skill]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApplied({ ...draft });
  }

  function onReset() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSubmit}
        className="card-outline space-y-4 p-4 sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="block min-w-0 text-sm">
            <label
              htmlFor="attempts-learner-filter"
              className="mb-1.5 block font-medium text-zinc-700"
            >
              {t("learner")}
            </label>
            <UserCombobox
              id="attempts-learner-filter"
              users={users}
              value={draft.userId}
              onChange={(userId) => setDraft((f) => ({ ...f, userId }))}
            />
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("classLabel", "Lớp")}
            </span>
            <select
              value={draft.classId}
              onChange={(e) =>
                setDraft((f) => ({ ...f, classId: e.target.value }))
              }
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            >
              <option value="">{t("allClasses", "Tất cả lớp")}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {classes.length === 0 ? (
              <span className="mt-1 block text-xs text-zinc-400">
                {t(
                  "classSoonHint",
                  "Danh sách lớp sẽ cập nhật khi có dữ liệu lớp.",
                )}
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {tc("skill")}
            </span>
            <select
              value={draft.skill}
              onChange={(e) =>
                setDraft((f) => ({
                  ...f,
                  skill: e.target.value as FiltersState["skill"],
                  // Clear test if it no longer matches the skill filter
                  testSlug: "",
                }))
              }
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            >
              {skillOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("testSearch", "Đề thi")}
            </span>
            <select
              value={draft.testSlug}
              onChange={(e) =>
                setDraft((f) => ({ ...f, testSlug: e.target.value }))
              }
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            >
              <option value="">{t("allTests", "Tất cả đề")}</option>
              {testOptions.map((test) => (
                <option key={test.slug} value={test.slug}>
                  {test.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("status")}
            </span>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((f) => ({
                  ...f,
                  status: e.target.value as FiltersState["status"],
                }))
              }
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">
                {t("fromDate")}
              </span>
              <input
                type="date"
                value={draft.from}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, from: e.target.value }))
                }
                className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">
                {t("toDate")}
              </span>
              <input
                type="date"
                value={draft.to}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, to: e.target.value }))
                }
                className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-wewin-navy px-4 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            <Search className="h-4 w-4" />
            {t("filter")}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-wewin-border bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t("clearFilter")}
          </button>
          <p className="text-xs text-zinc-500 sm:ml-2">
            {loading
              ? t("loading")
              : view === "grouped"
                ? t("groupCount", { n: groups.length, m: total })
                : t("count", { n: total })}
            {sourceLabel ? (
              <span className="text-zinc-400"> {sourceLabel}</span>
            ) : null}
          </p>
          <div
            role="group"
            aria-label={t("viewLabel")}
            className="inline-flex w-full rounded-xl border border-wewin-border bg-white p-0.5 text-sm sm:ml-auto sm:w-auto"
          >
            {(["grouped", "attempts"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                onClick={() => changeView(mode)}
                className={`flex-1 rounded-lg px-3 py-1.5 font-medium sm:flex-none ${
                  view === mode
                    ? "bg-wewin-navy text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {mode === "grouped" ? t("viewGrouped") : t("viewAttempts")}
              </button>
            ))}
          </div>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("loadingHistory")}
        </div>
      ) : attempts.length === 0 ? (
        <div className="card-outline px-6 py-12 text-center">
          <p className="text-base font-semibold text-zinc-900">
            {t("emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {t("emptyDesc")}
          </p>
        </div>
      ) : view === "grouped" ? (
        <div className="card-outline overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-wewin-accent-blue-bg/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("learner")}</th>
                <th className="px-4 py-3">{tc("testLabel")}</th>
                <th className="px-4 py-3">{t("colAttempts")}</th>
                <th className="px-4 py-3">{t("colFinalResult")}</th>
                <th className="px-4 py-3">{t("colTimeSpent")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageGroups.map((group) => {
                const { head, rows, combined } = group;
                const isOpen = expanded.has(group.key);
                const unfinished =
                  combined.totalAttempts - combined.finishedAttempts;
                const used = new Set(combined.usedAttemptIds);
                return (
                  <Fragment key={group.key}>
                    <tr className="border-t border-zinc-200 align-top">
                      <td className="max-w-[12rem] px-4 py-3 sm:max-w-[16rem]">
                        {renderLearner(head)}
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 sm:max-w-[18rem]">
                        {renderTest(head)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        <div className="font-medium">
                          {t("attemptsCount", { n: combined.totalAttempts })}
                        </div>
                        {unfinished > 0 ? (
                          <div className="text-xs text-amber-700">
                            {t("unfinishedCount", { n: unfinished })}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{renderCombined(head, combined)}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        <div className="font-semibold text-zinc-800">
                          {formatDuration(combined.totalDurationSeconds, t, dash)}
                        </div>
                        <div className="text-xs">
                          {t("firstStart", { time: fmt(combined.firstStartedAt) })}
                        </div>
                        <div className="text-xs">
                          {t("lastActivity", { time: fmt(combined.lastActivityAt) })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {rows.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.key)}
                              aria-expanded={isOpen}
                              className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-wewin-navy hover:underline"
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {isOpen
                                ? t("hideAttempts")
                                : t("showAttempts", { n: rows.length })}
                            </button>
                          ) : (
                            <Link
                              href={head.resultHref}
                              className="whitespace-nowrap font-medium text-wewin-navy hover:underline"
                            >
                              {head.status === "FINISHED"
                                ? t("openResult")
                                : t("openAttempt")}
                            </Link>
                          )}
                          {head.userId ? (
                            <Link
                              href={`/admin/reports/${head.userId}#test-${head.testSlug}`}
                              className="whitespace-nowrap text-xs text-zinc-500 hover:text-wewin-navy hover:underline"
                            >
                              {t("viewLearner")}
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isOpen
                      ? rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-t border-zinc-100 bg-zinc-50/70 text-xs"
                          >
                            <td className="px-4 py-2 pl-8 text-zinc-400">↳</td>
                            <td className="px-4 py-2">
                              {renderAttemptScope(row)}
                              {used.has(row.id) ? (
                                <span className="ml-1.5 inline-block rounded bg-wewin-accent-blue-bg px-1.5 py-0.5 text-[10px] font-semibold text-wewin-navy">
                                  {t("usedInFinal")}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-2 text-zinc-600">
                              {tm(row.mode, row.mode)}
                            </td>
                            <td className="px-4 py-2">{renderAttemptScore(row)}</td>
                            <td className="px-4 py-2 text-zinc-500">
                              <div>{fmt(row.startedAt)}</div>
                              {row.finishedAt ? (
                                <div>
                                  {t("submittedAt")} {fmt(row.finishedAt)} ·{" "}
                                  {formatDuration(
                                    attemptDurationSeconds(
                                      row.startedAt,
                                      row.finishedAt,
                                    ),
                                    t,
                                    dash,
                                  )}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Link
                                href={row.resultHref}
                                className="whitespace-nowrap font-medium text-wewin-navy hover:underline"
                              >
                                {row.status === "FINISHED"
                                  ? t("openResult")
                                  : t("openAttempt")}
                              </Link>
                            </td>
                          </tr>
                        ))
                      : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-outline overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-wewin-accent-blue-bg/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("learner")}</th>
                <th className="px-4 py-3">{tc("testLabel")}</th>
                <th className="px-4 py-3">{tc("mode")}</th>
                <th className="px-4 py-3">{tc("score")}</th>
                <th className="px-4 py-3">{tc("time")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageAttempts.map((row) => (
                <tr key={row.id} className="border-t border-zinc-200">
                  <td className="max-w-[12rem] px-4 py-3 sm:max-w-[16rem]">
                    {renderLearner(row)}
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 sm:max-w-[18rem]">
                    {renderTest(row)}
                    <div className="mt-0.5 text-xs">{renderAttemptScope(row)}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {tm(row.mode, row.mode)}
                  </td>
                  <td className="px-4 py-3">{renderAttemptScore(row)}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    <div>{fmt(row.startedAt)}</div>
                    {row.finishedAt ? (
                      <div className="text-xs">
                        {t("submittedAt")} {fmt(row.finishedAt)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={row.resultHref}
                      className="font-medium text-wewin-navy hover:underline"
                    >
                      {row.status === "FINISHED" ? t("openResult") : t("openAttempt")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
