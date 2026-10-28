import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { listAuditLogs, type AuditAction } from "@/lib/audit-log";
import type { AppRole } from "@/lib/auth/permissions";
import { getActivitySummary, type PeriodCount } from "@/lib/site-visit";
import { getTranslations } from "@/i18n/server";
import { practiceResultPath } from "@/lib/practice/paths";
import { requireAdminPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nhật ký hoạt động | Wewin IELTS Admin",
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function validRole(value: string): AppRole | "" {
  return value === "STUDENT" || value === "VISITOR" || value === "TEACHER" || value === "ADMIN"
    ? value
    : "";
}

function validAction(value: string): AuditAction | "" {
  const actions: AuditAction[] = ["LOGIN", "LOGOUT", "TEST_START", "USER_CREATE", "USER_UPDATE", "USER_PASSWORD_RESET", "USER_ACCESS_UPDATE", "USER_DELETE", "HOMEWORK_ASSIGN", "HOMEWORK_DEADLINE_UPDATE", "HOMEWORK_DELETE"];
  return actions.includes(value as AuditAction) ? value as AuditAction : "";
}

function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  for (const key of ["from", "to", "role", "action", "q"]) {
    const value = one(params[key]);
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/admin/audit-logs?${query.toString()}`;
}

function roleLabel(role: AppRole): string {
  if (role === "ADMIN") return "Quản trị viên";
  if (role === "TEACHER") return "Giáo viên";
  if (role === "VISITOR") return "Khách";
  return "Học viên";
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = { LOGIN: "Đăng nhập", LOGOUT: "Đăng xuất", TEST_START: "Bắt đầu làm test", USER_CREATE: "Tạo user", USER_UPDATE: "Sửa user", USER_PASSWORD_RESET: "Reset password", USER_ACCESS_UPDATE: "Cập nhật thời hạn", USER_DELETE: "Xóa user", CLASSROOM_JOIN: "Vào lớp Zoom", CLASSROOM_HOST_START: "Mở lớp Zoom (chủ trì)", CLASSROOM_PRESENTATION_UPDATE: "Đổi slide lớp học", CLASSROOM_CREATE: "Tạo lớp", CLASSROOM_UPDATE: "Sửa lớp", CLASSROOM_MEMBERS_UPDATE: "Cập nhật thành viên lớp", CLASS_SESSION_CREATE: "Tạo lịch học", CLASS_SESSION_UPDATE: "Sửa lịch học", CLASS_SESSION_DELETE: "Xóa lịch học", HOMEWORK_ASSIGN: "Giao bài tập", HOMEWORK_DEADLINE_UPDATE: "Sửa hạn nộp", HOMEWORK_DELETE: "Xóa bài tập", ZOOM_ACCOUNT_CREATE: "Thêm tài khoản Zoom", ZOOM_ACCOUNT_UPDATE: "Sửa tài khoản Zoom", ZOOM_ACCOUNT_DELETE: "Xóa tài khoản Zoom", ZOOM_HOST_LINK: "Chọn tài khoản Zoom chủ trì", ZOOM_HOST_UNLINK: "Bỏ tài khoản Zoom chủ trì" };
  return labels[action] ?? action;
}

function HomeworkAuditDetail({ metadata, format }: { metadata: unknown; format: Intl.DateTimeFormat }) {
  const m = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  const text = (key: string) => (typeof m[key] === "string" ? (m[key] as string) : null);
  const deadline = text("deadlineAt");
  const previous = text("previousDeadlineAt");
  return (
    <div className="mt-1.5 min-w-0 text-xs">
      <p className="break-words font-medium text-zinc-900">
        {text("testTitle") ?? text("testSlug") ?? "—"}
        {text("partLabel") ? <span className="font-normal text-zinc-500"> · {text("partLabel")}</span> : null}
      </p>
      <p className="mt-0.5 break-words text-zinc-500">
        {text("className") ?? "—"}
        {deadline ? (
          <>
            {" · Hạn: "}
            {previous ? `${format.format(new Date(previous))} → ` : ""}
            {format.format(new Date(deadline))}
          </>
        ) : null}
      </p>
    </div>
  );
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const from = one(params.from);
  const to = one(params.to);
  const role = validRole(one(params.role));
  const action = validAction(one(params.action));
  const query = one(params.q);
  const requestedPage = Number.parseInt(one(params.page), 10);
  const [result, summary, { t }, { t: tLog }] = await Promise.all([
    listAuditLogs({
      from,
      to,
      role,
      action,
      query,
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
    }),
    getActivitySummary(role).catch((error) => {
      console.error("[audit-logs] Could not load summary", error);
      return null;
    }),
    getTranslations("auditStats"),
    getTranslations("auditLogs"),
  ]);
  const numberFormat = new Intl.NumberFormat("vi-VN");
  const statCards: { key: string; title: string; main: PeriodCount; sub: PeriodCount; hintKey: string; hint: string }[] = summary
    ? [
        { key: "login", title: t("loginUsers", "Người đăng nhập"), main: summary.loginUsers, sub: summary.loginEvents, hintKey: "loginUsersHint", hint: "{n} lượt đăng nhập" },
        { key: "test", title: t("testUsers", "Người làm test"), main: summary.testUsers, sub: summary.testEvents, hintKey: "testUsersHint", hint: "{n} lượt bắt đầu test" },
        { key: "visit", title: t("visits", "Lượt truy cập"), main: summary.visits, sub: summary.visitors, hintKey: "visitsHint", hint: "{n} thiết bị khác nhau" },
      ]
    : [];
  const periods: { key: keyof PeriodCount; label: string }[] = [
    { key: "day", label: t("today", "Hôm nay") },
    { key: "week", label: t("thisWeek", "Tuần này") },
    { key: "month", label: t("thisMonth", "Tháng này") },
  ];
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const dateFormat = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "medium",
  });

  return (
    <SiteShell active="admin-audit-logs">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Nhật ký hoạt động</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Theo dõi hoạt động đăng nhập, đăng xuất và làm bài test.
          </p>
        </div>
        <Link href="/admin/users" className="text-sm font-medium text-wewin-navy hover:underline">
          Quản lý tài khoản
        </Link>
      </div>

      {summary ? (
        <section className="mb-5" aria-labelledby="audit-stats-title">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="audit-stats-title" className="text-lg font-semibold text-zinc-900">{t("title", "Thống kê tổng")}</h2>
            <p className="min-w-0 break-words text-xs text-zinc-500">
              {role
                ? t("roleNote", { role: roleLabel(role) }, "Đang lọc theo vai trò: {role}. Lượt truy cập luôn tính toàn trang.")
                : t("subtitle", "Tính theo giờ Việt Nam: hôm nay, tuần này (từ thứ Hai) và tháng này.")}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.key} className="wewin-card-3d min-w-0 p-4">
                <p className="text-sm font-semibold text-wewin-navy">{card.title}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2">
                  {periods.map((period) => (
                    <div key={period.key} className="min-w-0 rounded-lg bg-zinc-50 px-2 py-2 text-center">
                      <dt className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500">{period.label}</dt>
                      <dd className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">{numberFormat.format(card.main[period.key])}</dd>
                      <dd className="mt-0.5 break-words text-[11px] leading-tight text-zinc-500">
                        {t(card.hintKey, { n: numberFormat.format(card.sub[period.key]) }, card.hint)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <form className="wewin-card-3d mb-5 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="text-sm font-medium text-zinc-700">
          Từ ngày
          <input name="from" type="date" defaultValue={from} className="mt-1 w-full rounded-lg border border-wewin-border bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Đến ngày
          <input name="to" type="date" defaultValue={to} className="mt-1 w-full rounded-lg border border-wewin-border bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Vai trò
          <select name="role" defaultValue={role} className="mt-1 w-full rounded-lg border border-wewin-border bg-white px-3 py-2">
            <option value="">Tất cả</option>
            <option value="STUDENT">Học viên</option>
            <option value="VISITOR">Khách</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Hành động
          <select name="action" defaultValue={action} className="mt-1 w-full rounded-lg border border-wewin-border bg-white px-3 py-2">
            <option value="">Tất cả</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="LOGOUT">Đăng xuất</option>
            <option value="TEST_START">Bắt đầu làm test</option>
            <option value="USER_CREATE">Tạo user</option>
            <option value="USER_UPDATE">Sửa user</option>
            <option value="USER_PASSWORD_RESET">Reset password</option>
            <option value="USER_ACCESS_UPDATE">Cập nhật thời hạn</option>
            <option value="USER_DELETE">Xóa user</option>
            <option value="HOMEWORK_ASSIGN">Giao bài tập</option>
            <option value="HOMEWORK_DEADLINE_UPDATE">Sửa hạn nộp</option>
            <option value="HOMEWORK_DELETE">Xóa bài tập</option>
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700 xl:col-span-2">
          Tìm người dùng
          <div className="mt-1 flex gap-2">
            <input name="q" defaultValue={query} placeholder="Tên hiển thị hoặc username..." className="min-w-0 flex-1 rounded-lg border border-wewin-border bg-white px-3 py-2" />
            <button className="rounded-full bg-wewin-navy px-4 py-2 font-semibold text-white hover:bg-wewin-navy-hover">Lọc</button>
          </div>
        </label>
      </form>

      {!result.databaseAvailable ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chưa kết nối được database nên chưa thể đọc nhật ký.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-600">Tìm thấy {result.total} hoạt động</p>
          <div className="wewin-card-3d overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="border-b border-wewin-border bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">{tLog("deviceColumn", "Thiết bị / IP")}</th>
                  <th className="px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wewin-border">
                {result.items.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-zinc-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-800">{dateFormat.format(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{log.fullName || log.username}</p>
                    </td>
                    <td className="px-4 py-3">{roleLabel(log.role)}</td>
                    <td className="min-w-0 px-4 py-3">
                      {log.device || log.ipAddress ? (
                        <>
                          <p className="break-words text-zinc-800" title={log.userAgent ?? undefined}>{log.device ?? "—"}</p>
                          <p className="break-all font-mono text-xs text-zinc-500">{log.ipAddress ?? "—"}</p>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400">{tLog("deviceUnknown", "Chưa ghi nhận")}</span>
                      )}
                    </td>
                    <td className="min-w-0 px-4 py-3">
                      <span className={log.action === "LOGIN" ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700"}>
                        {actionLabel(log.action)}
                      </span>
                      {log.action.startsWith("HOMEWORK_") ? (
                        <HomeworkAuditDetail metadata={log.metadata} format={dateFormat} />
                      ) : null}
                      {log.test ? (
                        <div className="mt-1.5 min-w-0 text-xs">
                          <p className="break-words font-medium text-zinc-900">
                            {log.test.title ?? log.test.slug}
                            {log.test.resumed ? <span className="font-normal text-zinc-500"> · {tLog("resumed", "làm tiếp")}</span> : null}
                          </p>
                          {log.test.attemptId && log.test.finished ? (
                            <Link
                              href={practiceResultPath(log.test.slug, log.test.attemptId)}
                              prefetch={false}
                              className="mt-0.5 inline-block font-semibold text-wewin-navy hover:underline"
                            >
                              {tLog("viewResult", "Xem kết quả")} →
                            </Link>
                          ) : (
                            <p className="mt-0.5 text-zinc-500">
                              {!log.test.title
                                ? tLog("testRemoved", "Đề đã bị xoá")
                                : log.test.attemptId
                                  ? tLog("notSubmitted", "Chưa nộp bài")
                                  : tLog("attemptMissing", "Không tìm thấy bài làm")}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {result.items.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-500">Không có hoạt động phù hợp bộ lọc.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <nav className="mt-4 flex items-center justify-end gap-2 text-sm" aria-label="Phân trang nhật ký">
              {result.page > 1 ? <Link href={pageHref(params, result.page - 1)} className="rounded-full border border-wewin-border px-4 py-2 hover:bg-white">Trang trước</Link> : null}
              <span className="px-2 text-zinc-600">Trang {result.page}/{totalPages}</span>
              {result.page < totalPages ? <Link href={pageHref(params, result.page + 1)} className="rounded-full border border-wewin-border px-4 py-2 hover:bg-white">Trang sau</Link> : null}
            </nav>
          ) : null}
        </>
      )}
    </SiteShell>
  );
}
