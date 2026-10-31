import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { getUserDetailReport } from "@/lib/admin/user-detail";
import {
  partNumbers,
  type CombinedTestResult,
} from "@/lib/admin/test-progress";
import { requireStaffPage } from "@/lib/auth/page-guards";
import {
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  History,
  Laptop,
} from "lucide-react";

export const dynamic = "force-dynamic";

function skillBadgeClass(skill: string | null) {
  switch (skill) {
    case "LISTENING":
      return "bg-wewin-accent-blue-bg text-wewin-navy border-wewin-navy/10";
    case "READING":
      return "bg-wewin-bg text-wewin-navy border-wewin-navy/15";
    case "WRITING":
      return "bg-white text-wewin-navy border-wewin-navy/25";
    case "SPEAKING":
      return "bg-wewin-navy/10 text-wewin-navy border-wewin-navy/20";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function formatDateTime(iso: string | null | undefined, dash: string): string {
  if (!iso) return dash;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dash;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

function formatDate(iso: string | null | undefined, dash: string): string {
  if (!iso) return dash;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dash;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatDuration(
  seconds: number | null | undefined,
  t: Translator,
  dash: string,
): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return dash;
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
  t: Translator,
): string {
  if (!orders.length) return t("wholeTest");
  const list = partNumbers(orders, testSectionOrders).join(", ");
  return skill === "READING"
    ? t("passageList", { list })
    : t("partList", { list });
}

function FinalResult({
  final,
  skill,
  testSectionOrders,
  t,
}: {
  final: CombinedTestResult;
  skill: string | null;
  testSectionOrders: number[];
  t: Translator;
}) {
  if (final.correct != null && final.total != null) {
    return (
      <div className="space-y-0.5">
        <span className="text-base font-bold text-wewin-navy">
          {t("correctOf", { correct: final.correct, total: final.total })}
        </span>
        <div className="text-xs font-semibold text-emerald-700">
          {final.percent != null ? `${final.percent}%` : ""}
          {final.band != null
            ? ` · ${t("bandLabel", { band: final.band })}`
            : ""}
        </div>
        {final.sectionCount > 0 ? (
          <div
            className={`text-xs ${final.complete ? "text-emerald-700" : "text-amber-700"}`}
          >
            {final.complete
              ? t("partsComplete", { all: final.sectionCount })
              : t("partsDone", {
                  done: final.sectionsCovered.length,
                  all: final.sectionCount,
                })}
            {!final.complete && final.sectionsCovered.length
              ? ` (${sectionsLabel(final.sectionsCovered, testSectionOrders, skill, t)})`
              : ""}
          </div>
        ) : null}
      </div>
    );
  }
  if (final.band != null) {
    return (
      <span className="text-base font-bold text-wewin-navy">
        {t("bandLabel", { band: final.band })}
      </span>
    );
  }
  if (final.finishedAttempts === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        {t("inProgress")}
      </span>
    );
  }
  return <span className="text-zinc-400">{t("noScoreYet")}</span>;
}

export default async function AdminUserReportPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireStaffPage();
  const { userId } = await params;
  const data = await getUserDetailReport(userId);
  if (!data) notFound();

  const { t: tr } = await getTranslations("learnerReport");
  const { t } = await getTranslations("attemptsAdmin");
  const { t: ts } = await getTranslations("skills");
  const { t: tm } = await getTranslations("attemptModes");
  const { t: tc } = await getTranslations("common");
  const dash = tc("dash");

  const { user, report, logins, attempts, testSummaries, stats } = data;
  const weakSkills = report?.weakSkills ?? [];
  const sectionsBySlug = new Map(
    testSummaries.map((s) => [s.testSlug, s.sectionOrders]),
  );

  return (
    <SiteShell active="admin-reports">
      <main className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Link
                href="/admin/reports"
                className="font-medium text-wewin-navy hover:underline"
              >
                ← {tr("backReports")}
              </Link>
              <span>·</span>
              <Link
                href="/admin/attempts"
                className="font-medium text-zinc-600 hover:text-wewin-navy hover:underline"
              >
                {tr("allAttempts")}
              </Link>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="break-words text-2xl font-bold tracking-tight text-wewin-navy sm:text-3xl">
                {user.fullName || user.username}
              </h1>
              <span className="inline-flex items-center rounded-full bg-wewin-accent-blue-bg px-3 py-0.5 text-xs font-semibold text-wewin-navy">
                {tr(`role.${user.role}`, user.role === "STUDENT" ? "Học viên" : "Staff")}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                  user.accessStatus === "EXPIRED"
                    ? "bg-red-100 text-red-800"
                    : user.accessStatus === "EXPIRING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {user.accessStatus === "EXPIRED"
                  ? tr("accessExpired")
                  : user.accessStatus === "EXPIRING"
                    ? tr("accessExpiring")
                    : user.accessStatus === "UNLIMITED"
                      ? tr("accessUnlimited")
                      : tr("accessActive")}
              </span>
            </div>
            <p className="break-words text-sm text-zinc-600">
              <span className="font-semibold text-zinc-800">{tr("learnerCode")}</span>{" "}
              {user.username}
              {" · "}
              <span className="font-semibold text-zinc-800">{tr("classLabel")}</span>{" "}
              {user.classCode ? (
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-800">
                  {user.classCode}
                </span>
              ) : (
                tr("noClass")
              )}
              {" · "}
              <span className="font-semibold text-zinc-800">{tr("emailLabel")}</span>{" "}
              {user.email || tr("noEmail")}
            </p>
          </div>

          <Link
            href={`/admin/attempts?userId=${user.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-wewin-border bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {tr("filterAttempts")}
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {tr("statTests")}
              </span>
              <BookOpen className="h-4 w-4 text-wewin-navy" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-wewin-navy">
              {stats.totalTestsAttempted}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{tr("statTestsHint")}</p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {tr("statAttempts")}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
              {stats.finishedAttempts}
              <span className="text-base font-medium text-zinc-400">
                {" "}
                / {tr("attemptsOf", { n: stats.totalAttempts })}
              </span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {stats.unfinishedAttempts > 0
                ? tr("unfinishedHint", { n: stats.unfinishedAttempts })
                : tr("allSubmitted")}
            </p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {tr("statTime")}
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700">
              {formatDuration(stats.totalPracticeTimeSeconds, t, dash)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{tr("statTimeHint")}</p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {tr("statLogins")}
              </span>
              <ShieldCheck className="h-4 w-4 text-wewin-navy" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-wewin-navy">
              {stats.totalLogins}
            </p>
            <p
              className="mt-1 truncate text-xs text-zinc-500"
              title={
                stats.lastLoginAt
                  ? formatDateTime(stats.lastLoginAt, dash)
                  : undefined
              }
            >
              {stats.lastLoginAt
                ? tr("lastLogin", { date: formatDate(stats.lastLoginAt, dash) })
                : tr("noLogin")}
            </p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {tr("statWeak")}
              </span>
              <AlertCircle
                className={`h-4 w-4 ${weakSkills.length ? "text-red-600" : "text-zinc-400"}`}
              />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${weakSkills.length ? "text-red-700" : "text-emerald-700"}`}
            >
              {weakSkills.length
                ? weakSkills.map((s) => ts(s, s)).join(", ")
                : tr("none")}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {weakSkills.length ? tr("weakHint") : tr("stableHint")}
            </p>
          </div>
        </section>

        <section className="space-y-4" id="test-summary">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
                <Award className="h-5 w-5 text-wewin-navy" />
                {tr("summaryTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{tr("summaryDesc")}</p>
            </div>
            <span className="text-xs font-semibold text-zinc-500">
              {tr("testsCount", { n: testSummaries.length })}
            </span>
          </div>

          {testSummaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              {tr("summaryEmpty")}
            </div>
          ) : (
            <div className="wewin-card-3d overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="p-3.5">{tr("colTest")}</th>
                    <th className="p-3.5">{tr("colSkill")}</th>
                    <th className="p-3.5">
                      <span className="text-wewin-navy">{t("colFinalResult")}</span>
                      <span className="block text-[10px] font-normal normal-case text-zinc-400">
                        {tr("colFinalHint")}
                      </span>
                    </th>
                    <th className="p-3.5">
                      {t("colTimeSpent")}
                      <span className="block text-[10px] font-normal normal-case text-zinc-400">
                        {tr("colTimeHint")}
                      </span>
                    </th>
                    <th className="p-3.5">
                      {tr("colBest")}
                      <span className="block text-[10px] font-normal normal-case text-zinc-400">
                        {tr("colBestHint")}
                      </span>
                    </th>
                    <th className="p-3.5 text-center">{t("colAttempts")}</th>
                    <th className="p-3.5">{tr("colLastActivity")}</th>
                    <th className="p-3.5 text-right">{tr("colDetail")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {testSummaries.map((summary) => {
                    const { final } = summary;
                    const unfinished =
                      final.totalAttempts - final.finishedAttempts;
                    return (
                      <tr
                        key={summary.testSlug}
                        id={`test-${summary.testSlug}`}
                        className="scroll-mt-24 transition-colors target:bg-wewin-accent-blue-bg/60 hover:bg-zinc-50/70"
                      >
                        <td className="p-3.5 font-medium text-zinc-900">
                          <p className="font-semibold">{summary.testTitle}</p>
                          <p className="font-mono text-xs text-zinc-400">
                            {summary.testSlug}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${skillBadgeClass(summary.skill)}`}
                          >
                            {summary.skill ? ts(summary.skill, summary.skill) : dash}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <FinalResult
                            final={final}
                            skill={summary.skill}
                            testSectionOrders={summary.sectionOrders}
                            t={t}
                          />
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-zinc-800">
                            {formatDuration(final.totalDurationSeconds, t, dash)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {summary.bestCorrect != null &&
                          summary.bestTotal != null ? (
                            <span className="font-semibold text-zinc-800">
                              {summary.bestCorrect}/{summary.bestTotal}
                              {summary.bestPercent != null
                                ? ` (${summary.bestPercent}%)`
                                : ""}
                            </span>
                          ) : summary.bestBand != null ? (
                            <span className="font-semibold text-zinc-800">
                              {t("bandLabel", { band: summary.bestBand })}
                            </span>
                          ) : (
                            <span className="text-zinc-400">{dash}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-800">
                            {t("attemptsCount", { n: final.totalAttempts })}
                          </span>
                          {unfinished > 0 ? (
                            <p className="mt-0.5 text-[10px] font-medium text-amber-600">
                              {t("unfinishedCount", { n: unfinished })}
                            </p>
                          ) : null}
                        </td>
                        <td className="p-3.5 text-xs text-zinc-600">
                          <div>
                            {t("firstStart", {
                              time: formatDateTime(final.firstStartedAt, dash),
                            })}
                          </div>
                          <div>
                            {t("lastActivity", {
                              time: formatDateTime(final.lastActivityAt, dash),
                            })}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={summary.latestResultHref}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-wewin-navy hover:underline"
                          >
                            {tr("viewLatest")}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4" id="attempts-history">
          <div className="border-b border-zinc-200 pb-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
              <History className="h-5 w-5 text-wewin-navy" />
              {tr("historyTitle", { n: attempts.length })}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">{tr("historyDesc")}</p>
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              {tr("historyEmpty")}
            </div>
          ) : (
            <div className="wewin-card-3d overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">{tr("colTest")}</th>
                    <th className="p-3.5">{tr("colSkillMode")}</th>
                    <th className="p-3.5">{tr("colScore")}</th>
                    <th className="p-3.5">{tr("colStarted")}</th>
                    <th className="p-3.5">{tr("colSubmitted")}</th>
                    <th className="p-3.5">{tr("colDuration")}</th>
                    <th className="p-3.5">{tr("colStatus")}</th>
                    <th className="p-3.5 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {attempts.map((att, idx) => {
                    const aiSkill =
                      att.skill === "WRITING" || att.skill === "SPEAKING";
                    return (
                      <tr
                        key={att.id}
                        className="transition-colors hover:bg-zinc-50/70"
                      >
                        <td className="p-3.5 text-xs font-bold text-zinc-400">
                          {attempts.length - idx}
                        </td>
                        <td className="p-3.5 font-medium text-zinc-900">
                          <p className="font-semibold">{att.testTitle}</p>
                          {!aiSkill ? (
                            <p className="text-xs text-zinc-500">
                              {sectionsLabel(
                                att.sectionOrders,
                                sectionsBySlug.get(att.testSlug) ?? [],
                                att.skill,
                                t,
                              )}
                              {att.partial ? ` · ${t("redoWrong")}` : ""}
                            </p>
                          ) : null}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {att.skill ? (
                              <span
                                className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${skillBadgeClass(att.skill)}`}
                              >
                                {ts(att.skill, att.skill)}
                              </span>
                            ) : null}
                            <span className="text-xs text-zinc-500">
                              {tm(att.mode, att.mode)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {att.status === "UNFINISHED" ? (
                            <span className="text-xs font-semibold text-amber-700">
                              {tr("notSubmitted")}
                            </span>
                          ) : !aiSkill &&
                            att.scoreCorrect != null &&
                            att.scoreTotal != null ? (
                            <div>
                              <span className="font-bold text-zinc-900">
                                {att.scoreCorrect}/{att.scoreTotal}
                              </span>
                              {att.scorePercent != null ? (
                                <span className="ml-1 text-xs font-medium text-emerald-700">
                                  ({att.scorePercent}%)
                                </span>
                              ) : null}
                            </div>
                          ) : att.scoreBand != null ? (
                            <span className="font-bold text-zinc-900">
                              {t("bandLabel", { band: att.scoreBand })}
                            </span>
                          ) : (
                            <span className="text-zinc-400">{dash}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-3.5 text-xs text-zinc-600">
                          {formatDateTime(att.startedAt, dash)}
                        </td>
                        <td className="whitespace-nowrap p-3.5 text-xs text-zinc-600">
                          {formatDateTime(att.finishedAt, dash)}
                        </td>
                        <td className="whitespace-nowrap p-3.5 text-xs font-semibold text-zinc-700">
                          {formatDuration(att.durationSeconds, t, dash)}
                        </td>
                        <td className="p-3.5">
                          {att.status === "FINISHED" ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              {t("finished")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              {t("inProgress")}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-3.5 text-right">
                          <Link
                            href={att.resultHref}
                            className="text-xs font-semibold text-wewin-navy hover:underline"
                          >
                            {att.status === "FINISHED"
                              ? t("openResult")
                              : t("openAttempt")}{" "}
                            →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4" id="login-history">
          <div className="border-b border-zinc-200 pb-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
              <Laptop className="h-5 w-5 text-wewin-navy" />
              {tr("loginTitle", { n: logins.length })}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">{tr("loginDesc")}</p>
          </div>

          {logins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              {tr("loginEmpty")}
            </div>
          ) : (
            <div className="wewin-card-3d overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="p-3.5">{tr("colLoginAt")}</th>
                    <th className="p-3.5">{tr("colDevice")}</th>
                    <th className="p-3.5">{tr("colIp")}</th>
                    <th className="p-3.5">{tr("colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {logins.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-zinc-50/70"
                    >
                      <td className="whitespace-nowrap p-3.5 font-medium text-zinc-900">
                        {formatDateTime(item.createdAt, dash)}
                      </td>
                      <td className="p-3.5 text-zinc-700">
                        {item.device || tr("unknownDevice")}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-zinc-600">
                        {item.ipAddress || dash}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {tr("loginSuccess")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {report?.skills?.length ? (
          <section className="space-y-4" id="skill-progress">
            <div className="border-b border-zinc-200 pb-2">
              <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
                <TrendingUp className="h-5 w-5 text-wewin-navy" />
                {tr("skillTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{tr("skillDesc")}</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {report.skills.map((skill) => {
                const activeParts = skill.parts.filter(
                  (part) => part.status !== "NOT_STARTED",
                );
                return (
                  <section
                    key={skill.skill}
                    className="wewin-card-3d overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 border-b bg-zinc-50 px-4 py-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-wewin-navy">
                          {ts(skill.skill, skill.skill)}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {tr("partsProgress", {
                            done: skill.completedParts,
                            open: activeParts.length - skill.completedParts,
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-sm ${skill.weak ? "font-bold text-red-700" : "font-semibold text-zinc-700"}`}
                      >
                        {skill.average == null
                          ? t("noScoreYet")
                          : ["LISTENING", "READING"].includes(skill.skill)
                            ? `${skill.average}%`
                            : t("bandLabel", { band: skill.average })}
                      </span>
                    </div>
                    <div className="max-h-[28rem] overflow-auto">
                      {activeParts.length ? (
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 border-b bg-white text-xs text-zinc-500">
                            <tr>
                              <th className="p-3">{tr("colPart")}</th>
                              <th className="p-3">{tr("colStatus")}</th>
                              <th className="p-3">{tr("colAverage")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {activeParts.map((part) => (
                              <tr key={part.key} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-medium text-zinc-800">
                                  {part.label}
                                </td>
                                <td
                                  className={`p-3 font-semibold ${
                                    part.status === "WEAK"
                                      ? "text-red-700"
                                      : part.status === "COMPLETED"
                                        ? "text-emerald-700"
                                        : "text-amber-700"
                                  }`}
                                >
                                  {tr(`partStatus.${part.status}`)}
                                </td>
                                <td className="p-3 text-zinc-600">
                                  {part.average ?? dash}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="px-4 py-8 text-center text-sm text-zinc-500">
                          {tr("noPartsStarted")}
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}
