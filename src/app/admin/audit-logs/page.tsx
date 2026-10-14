import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { listAuditLogs, type AuditAction } from "@/lib/audit-log";
import type { AppRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nhật ký hoạt động | Wewin IELTS Admin",
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function validRole(value: string): AppRole | "" {
  return value === "STUDENT" || value === "TEACHER" || value === "ADMIN"
    ? value
    : "";
}

function validAction(value: string): AuditAction | "" {
  return value === "LOGIN" || value === "LOGOUT" ? value : "";
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
  return "Học viên";
}

function actionLabel(action: string): string {
  return action === "LOGIN" ? "Đăng nhập" : "Đăng xuất";
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const from = one(params.from);
  const to = one(params.to);
  const role = validRole(one(params.role));
  const action = validAction(one(params.action));
  const query = one(params.q);
  const requestedPage = Number.parseInt(one(params.page), 10);
  const result = await listAuditLogs({
    from,
    to,
    role,
    action,
    query,
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
  });
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
            Theo dõi thời gian đăng nhập, đăng xuất của học viên và giáo viên.
          </p>
        </div>
        <Link href="/admin/users" className="text-sm font-medium text-wewin-navy hover:underline">
          Quản lý tài khoản
        </Link>
      </div>

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
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700 xl:col-span-2">
          Tìm người dùng hoặc IP
          <div className="mt-1 flex gap-2">
            <input name="q" defaultValue={query} placeholder="Tên, username, IP..." className="min-w-0 flex-1 rounded-lg border border-wewin-border bg-white px-3 py-2" />
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
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-wewin-border bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Thiết bị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wewin-border">
                {result.items.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-zinc-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-800">{dateFormat.format(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{log.fullName || log.username}</p>
                      {log.fullName ? <p className="text-xs text-zinc-500">@{log.username}</p> : null}
                    </td>
                    <td className="px-4 py-3">{roleLabel(log.role)}</td>
                    <td className="px-4 py-3">
                      <span className={log.action === "LOGIN" ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700"}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{log.ipAddress || "—"}</td>
                    <td className="max-w-sm truncate px-4 py-3 text-xs text-zinc-500" title={log.userAgent || undefined}>{log.userAgent || "—"}</td>
                  </tr>
                ))}
                {result.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Không có hoạt động phù hợp bộ lọc.</td></tr>
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