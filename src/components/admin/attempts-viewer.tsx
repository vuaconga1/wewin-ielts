"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import type {
  AdminAttemptRow,
  AdminAttemptSkill,
  AdminUserOption,
} from "@/lib/admin/attempts";
import { localeToIntl } from "@/i18n/config";
import { useTranslations } from "@/i18n/provider";

type FiltersState = {
  userId: string;
  userQ: string;
  skill: "ALL" | AdminAttemptSkill;
  testQ: string;
  status: "ALL" | "FINISHED" | "UNFINISHED";
  from: string;
  to: string;
};

const EMPTY_FILTERS: FiltersState = {
  userId: "",
  userQ: "",
  skill: "ALL",
  testQ: "",
  status: "ALL",
  from: "",
  to: "",
};

type ApiResponse = {
  attempts: AdminAttemptRow[];
  users: AdminUserOption[];
  total: number;
  source: "prisma" | "local" | "mixed";
  error?: string;
};

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

export function AttemptsViewer() {
  const { t, locale } = useTranslations("attemptsAdmin");
  const { t: ts } = useTranslations("skills");
  const { t: tm } = useTranslations("attemptModes");
  const { t: tc } = useTranslations("common");
  const intlLocale = localeToIntl(locale);
  const [draft, setDraft] = useState<FiltersState>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FiltersState>(EMPTY_FILTERS);
  const [attempts, setAttempts] = useState<AdminAttemptRow[]>([]);
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<"prisma" | "local" | "mixed" | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (filters.userQ.trim()) params.set("userQ", filters.userQ.trim());
      if (filters.skill !== "ALL") params.set("skill", filters.skill);
      if (filters.testQ.trim()) params.set("testQ", filters.testQ.trim());
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const res = await fetch(`/api/admin/attempts?${params.toString()}`);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(data.error ?? t("loadFailed"));
        setAttempts([]);
        setTotal(0);
        return;
      }
      setAttempts(data.attempts);
      setUsers(data.users);
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
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("learner")}
            </span>
            <select
              value={draft.userId}
              onChange={(e) =>
                setDraft((f) => ({ ...f, userId: e.target.value }))
              }
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            >
              <option value="">{t("allLearners")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} · {u.email}
                  {u.attemptCount ? ` (${u.attemptCount})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("searchUser")}
            </span>
            <input
              type="search"
              value={draft.userQ}
              onChange={(e) =>
                setDraft((f) => ({ ...f, userQ: e.target.value }))
              }
              placeholder={t("searchUserPh")}
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            />
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
              {t("testSearch")}
            </span>
            <input
              type="search"
              value={draft.testQ}
              onChange={(e) =>
                setDraft((f) => ({ ...f, testQ: e.target.value }))
              }
              placeholder={t("testSearchPh")}
              className="w-full rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-wewin-navy"
            />
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
            {loading ? t("loading") : t("count", { n: total })}
            {sourceLabel ? (
              <span className="text-zinc-400"> {sourceLabel}</span>
            ) : null}
          </p>
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
              {attempts.map((row) => (
                <tr key={row.id} className="border-t border-zinc-200">
                  <td className="max-w-[12rem] px-4 py-3 sm:max-w-[16rem]">
                    <div className="break-words font-medium text-zinc-900">
                      {row.username ?? tc("dash")}
                    </div>
                    <div className="break-all text-xs text-zinc-500">
                      {row.userEmail ?? t("guestUser")}
                    </div>
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 sm:max-w-[18rem]">
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
                      <span className="break-all text-xs text-zinc-400">
                        {row.testSlug}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {tm(row.mode, row.mode)}
                  </td>
                  <td className="px-4 py-3">
                    {row.scoreLabel ? (
                      <span className="text-zinc-900">{row.scoreLabel}</span>
                    ) : row.status === "FINISHED" ? (
                      <span className="text-zinc-400">{tc("dash")}</span>
                    ) : (
                      <span className="text-wewin-navy/70">{t("inProgress")}</span>
                    )}
                    {row.scoreBand != null && !row.scoreLabel?.includes("band") ? (
                      <div className="text-xs text-zinc-500">
                        Band {row.scoreBand}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    <div>
                      {new Date(row.startedAt).toLocaleString(intlLocale)}
                    </div>
                    {row.finishedAt ? (
                      <div className="text-xs">
                        {t("submittedAt")}{" "}
                        {new Date(row.finishedAt).toLocaleString(intlLocale)}
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
    </div>
  );
}
