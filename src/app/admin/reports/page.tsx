import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { buildAdminReports, type UserReportRow } from "@/lib/admin/reports";
import { getTranslations } from "@/i18n/server";
import { requireStaffPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type ReportsSort = "activity_desc" | "activity_asc" | "attempts_desc" | "newest";

type ReportsParams = {
  q?: string;
  access?: string;
  progress?: string;
  sort?: string;
  page?: string;
};

function parseSort(value: string | undefined): ReportsSort {
  if (value === "activity_asc" || value === "attempts_desc" || value === "newest") return value;
  return "activity_desc";
}

function sortRows(rows: UserReportRow[], sort: ReportsSort): UserReportRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === "activity_asc") {
      const byActivity = a.activityCount - b.activityCount;
      if (byActivity !== 0) return byActivity;
    } else if (sort === "attempts_desc") {
      const byAttempts = b.finishedAttempts - a.finishedAttempts;
      if (byAttempts !== 0) return byAttempts;
    } else if (sort === "newest") {
      return b.user.createdAt.localeCompare(a.user.createdAt);
    } else {
      const byActivity = b.activityCount - a.activityCount;
      if (byActivity !== 0) return byActivity;
    }
    const byName = (a.user.fullName || a.user.username).localeCompare(
      b.user.fullName || b.user.username,
      "vi",
    );
    if (byName !== 0) return byName;
    return a.user.username.localeCompare(b.user.username);
  });
  return copy;
}

function reportsPageHref(params: Omit<ReportsParams, "page">, page: number) {
  const query = new URLSearchParams();
  const q = params.q?.trim();
  if (q) query.set("q", q);
  if (params.access && params.access !== "ALL") query.set("access", params.access);
  if (params.progress && params.progress !== "ALL") query.set("progress", params.progress);
  const sort = parseSort(params.sort);
  if (sort !== "activity_desc") query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/reports?${qs}` : "/admin/reports";
}

function pageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total]);
  for (let index = current - 1; index <= current + 1; index += 1) {
    if (index >= 1 && index <= total) pages.add(index);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index]! - sorted[index - 1]! > 1) out.push("ellipsis");
    out.push(sorted[index]!);
  }
  return out;
}

function accessLabel(status: string, t: (key: string, fallback: string) => string) {
  if (status === "EXPIRED") return t("reportsAccessExpired", "Đã hết hạn");
  if (status === "EXPIRING") return t("reportsAccessExpiring", "Sắp hết hạn");
  if (status === "UNLIMITED") return t("reportsAccessUnlimited", "Không giới hạn");
  return t("reportsAccessActive", "Hoạt động");
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<ReportsParams>;
}) {
  await requireStaffPage();
  const params = await searchParams;
  const { t } = await getTranslations("admin");
  const sort = parseSort(params.sort);
  const reports = await buildAdminReports();
  const q = params.q?.trim().toLowerCase() ?? "";
  const filtered = reports.filter((row) => {
    if (params.access && params.access !== "ALL" && row.user.accessStatus !== params.access) return false;
    if (params.progress === "WEAK" && !row.weakSkills.length) return false;
    if (params.progress === "UNFINISHED" && !row.unfinishedAttempts) return false;
    if (params.progress === "NOT_STARTED" && row.finishedAttempts + row.unfinishedAttempts > 0) return false;
    return (
      !q ||
      [row.user.username, row.user.fullName, row.user.email, row.user.classCode].some((value) =>
        value?.toLowerCase().includes(q),
      )
    );
  });
  const rows = sortRows(filtered, sort);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cards = [
    [t("reportsCardTotal", "Tổng học viên"), reports.length],
    [
      t("reportsCardActiveAccess", "Đang hoạt động"),
      reports.filter((row) => ["ACTIVE", "EXPIRING", "UNLIMITED"].includes(row.user.accessStatus)).length,
    ],
    [t("reportsCardExpired", "Đã hết hạn"), reports.filter((row) => row.user.accessStatus === "EXPIRED").length],
    [
      t("reportsCardNotStarted", "Chưa làm bài"),
      reports.filter((row) => row.finishedAttempts + row.unfinishedAttempts === 0).length,
    ],
    [t("reportsCardWeak", "Có kỹ năng yếu"), reports.filter((row) => row.weakSkills.length > 0).length],
  ] as const;

  return (
    <SiteShell active="admin-reports">
      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-wewin-navy">{t("reportsTitle", "Báo cáo học viên")}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t(
              "reportsDesc",
              "Tiến độ và điểm trung bình của tối đa 3 lần hoàn thành gần nhất. Sắp xếp theo hoạt động từ Nhật ký hoạt động.",
            )}
          </p>
        </div>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map(([label, value]) => (
            <div key={label} className="wewin-card-3d p-4">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-wewin-navy">{value}</p>
            </div>
          ))}
        </section>
        <form
          method="get"
          action="/admin/reports"
          className="grid gap-3 rounded-xl border border-wewin-border bg-white p-4 md:grid-cols-[1fr_12rem_12rem_14rem_auto]"
        >
          <input
            name="q"
            defaultValue={params.q}
            placeholder={t("reportsSearchPlaceholder", "Tên, username, email, lớp")}
            className="min-w-0 rounded-lg border border-wewin-border px-3 py-2 text-sm"
          />
          <select
            name="access"
            defaultValue={params.access ?? "ALL"}
            className="rounded-lg border border-wewin-border px-3 py-2 text-sm"
            aria-label={t("reportsFilterAccess", "Lọc thời hạn")}
          >
            <option value="ALL">{t("reportsAccessAll", "Mọi thời hạn")}</option>
            <option value="ACTIVE">{t("reportsAccessActive", "Đang hoạt động")}</option>
            <option value="EXPIRING">{t("reportsAccessExpiring", "Sắp hết hạn")}</option>
            <option value="EXPIRED">{t("reportsAccessExpired", "Đã hết hạn")}</option>
            <option value="UNLIMITED">{t("reportsAccessUnlimited", "Không giới hạn")}</option>
          </select>
          <select
            name="progress"
            defaultValue={params.progress ?? "ALL"}
            className="rounded-lg border border-wewin-border px-3 py-2 text-sm"
            aria-label={t("reportsFilterProgress", "Lọc tiến độ")}
          >
            <option value="ALL">{t("reportsProgressAll", "Mọi tiến độ")}</option>
            <option value="WEAK">{t("reportsProgressWeak", "Có kỹ năng yếu")}</option>
            <option value="UNFINISHED">{t("reportsProgressUnfinished", "Có bài chưa hoàn thành")}</option>
            <option value="NOT_STARTED">{t("reportsProgressNotStarted", "Chưa làm bài")}</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-lg border border-wewin-border px-3 py-2 text-sm"
            aria-label={t("reportsSortLabel", "Sắp xếp")}
          >
            <option value="activity_desc">{t("reportsSortActivityDesc", "Hoạt động nhiều → ít")}</option>
            <option value="activity_asc">{t("reportsSortActivityAsc", "Hoạt động ít → nhiều")}</option>
            <option value="attempts_desc">{t("reportsSortAttemptsDesc", "Nhiều bài làm nhất")}</option>
            <option value="newest">{t("reportsSortNewest", "Tài khoản mới nhất")}</option>
          </select>
          <button type="submit" className="rounded-lg bg-wewin-navy px-5 py-2 text-sm font-semibold text-white">
            {t("reportsFilterSubmit", "Lọc")}
          </button>
        </form>
        <div className="wewin-card-3d overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-3">{t("reportsColLearner", "Học viên")}</th>
                <th className="p-3">{t("reportsColAccess", "Thời hạn")}</th>
                <th className="p-3">{t("reportsColActivity", "Hoạt động")}</th>
                {["Listening", "Reading", "Writing", "Speaking"].map((skill) => (
                  <th key={skill} className="p-3">
                    {skill}
                  </th>
                ))}
                <th className="p-3">{t("reportsColAttempts", "Bài làm")}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.user.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/admin/reports/${row.user.id}`}
                      className="font-semibold text-wewin-navy hover:underline"
                    >
                      {row.user.fullName || row.user.username}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {row.user.username} · {row.user.classCode || t("reportsNoClass", "Chưa có lớp")}
                    </p>
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        row.user.accessStatus === "EXPIRED" ? "text-red-700" : "text-emerald-700"
                      }
                    >
                      {accessLabel(row.user.accessStatus, t)}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/audit-logs?q=${encodeURIComponent(row.user.username)}`}
                      className="font-semibold text-wewin-navy hover:underline"
                      title={t("reportsActivityHint", "Xem chi tiết trong Nhật ký hoạt động")}
                    >
                      {t("reportsActivityCount", { n: row.activityCount }, "{n} lần")}
                    </Link>
                  </td>
                  {row.skills.map((skill) => (
                    <td key={skill.skill} className="p-3">
                      <p className={skill.weak ? "font-semibold text-red-700" : "text-zinc-800"}>
                        {skill.completedTests}/{skill.totalTests} test
                      </p>
                      <p className="text-xs text-zinc-500">
                        {skill.average == null
                          ? t("reportsNoScore", "Chưa có điểm")
                          : `${skill.average}${skill.skill === "LISTENING" || skill.skill === "READING" ? "%" : " band"}`}
                      </p>
                    </td>
                  ))}
                  <td className="p-3">
                    {t(
                      "reportsAttemptsSummary",
                      { finished: row.finishedAttempts, unfinished: row.unfinishedAttempts },
                      "{finished} xong · {unfinished} đang làm",
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/reports/${row.user.id}`}
                      className="font-semibold text-wewin-navy hover:underline"
                    >
                      {t("reportsDetail", "Chi tiết")}
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-zinc-500">
                    {t("reportsEmpty", "Không có học viên phù hợp.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {rows.length > 0 ? (
          <nav
            className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            aria-label={t("reportsPagination", "Phân trang danh sách học viên")}
          >
            <p className="min-w-0 text-sm text-zinc-600">
              {t(
                "pageInfo",
                {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, rows.length),
                  total: rows.length,
                },
                "Hiển thị {from}–{to} / {total}",
              )}
            </p>
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  aria-disabled={page <= 1}
                  href={page <= 1 ? reportsPageHref(params, 1) : reportsPageHref(params, page - 1)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${page <= 1 ? "pointer-events-none border-zinc-200 text-zinc-400" : "border-wewin-border text-zinc-700 hover:bg-zinc-50"}`}
                >
                  {t("prevPage", "Trước")}
                </Link>
                {pageNumbers(page, totalPages).map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-sm text-zinc-400" aria-hidden>
                      …
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={reportsPageHref(params, item)}
                      aria-current={item === page ? "page" : undefined}
                      className={`min-w-9 rounded-lg border px-3 py-2 text-center text-sm font-medium ${item === page ? "border-wewin-navy bg-wewin-navy text-white" : "border-zinc-200 bg-white text-wewin-navy hover:bg-wewin-accent-blue-bg"}`}
                    >
                      {item}
                    </Link>
                  ),
                )}
                <Link
                  aria-disabled={page >= totalPages}
                  href={
                    page >= totalPages
                      ? reportsPageHref(params, totalPages)
                      : reportsPageHref(params, page + 1)
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${page >= totalPages ? "pointer-events-none border-zinc-200 text-zinc-400" : "border-wewin-border text-zinc-700 hover:bg-zinc-50"}`}
                >
                  {t("nextPage", "Sau")}
                </Link>
              </div>
            ) : (
              <p className="text-sm font-medium text-zinc-700">
                {t("pageOf", { page, total: totalPages }, "Trang {page} / {total}")}
              </p>
            )}
          </nav>
        ) : null}
      </main>
    </SiteShell>
  );
}
