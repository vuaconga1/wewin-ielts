import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { getUserDetailReport } from "@/lib/admin/user-detail";
import { requireStaffPage } from "@/lib/auth/page-guards";
import {
  Clock,
  CheckCircle2,
  Calendar,
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

const statusLabel = {
  NOT_STARTED: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Đã làm",
  WEAK: "Yếu",
} as const;

function skillBadgeClass(skill: string | null) {
  switch (skill) {
    case "LISTENING":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "READING":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "WRITING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "SPEAKING":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function formatViDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
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
  } catch {
    return iso;
  }
}

function formatViDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
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

  const { user, report, logins, attempts, testSummaries, stats } = data;

  return (
    <SiteShell active="admin-reports">
      <main className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-8 sm:px-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Link
                href="/admin/reports"
                className="font-medium text-wewin-navy hover:underline"
              >
                ← Báo cáo học viên
              </Link>
              <span>·</span>
              <Link
                href="/admin/attempts"
                className="font-medium text-zinc-600 hover:text-wewin-navy hover:underline"
              >
                Lịch sử làm bài chung
              </Link>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-wewin-navy">
                {user.fullName || user.username}
              </h1>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800">
                {user.role === "STUDENT" ? "Học viên" : user.role}
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
                  ? "Đã hết hạn"
                  : user.accessStatus === "EXPIRING"
                    ? "Sắp hết hạn"
                    : user.accessStatus === "UNLIMITED"
                      ? "Không giới hạn"
                      : "Hoạt động"}
              </span>
            </div>
            <p className="text-sm text-zinc-600">
              <span className="font-semibold text-zinc-800">Mã HV:</span> {user.username}
              {" · "}
              <span className="font-semibold text-zinc-800">Lớp:</span>{" "}
              {user.classCode ? (
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-800">
                  {user.classCode}
                </span>
              ) : (
                "Chưa gắn lớp"
              )}
              {" · "}
              <span className="font-semibold text-zinc-800">Email:</span>{" "}
              {user.email || "Chưa có email"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/attempts?userId=${user.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-wewin-border bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Lọc riêng trên bảng Attempts
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Đề đã làm
              </span>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-wewin-navy">
              {stats.totalTestsAttempted}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Đề thi khác nhau</p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Lượt làm bài
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
              {stats.finishedAttempts}
              <span className="text-base font-medium text-zinc-400">
                {" "}
                / {stats.totalAttempts} lượt
              </span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {stats.unfinishedAttempts > 0
                ? `${stats.unfinishedAttempts} lượt chưa hoàn thành`
                : "Tất cả bài đã nộp"}
            </p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Thời gian ôn luyện
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700">
              {stats.totalPracticeTimeLabel}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tổng thời gian làm bài thực tế
            </p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Lượt đăng nhập
              </span>
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-purple-700">
              {stats.totalLogins}
            </p>
            <p className="mt-1 text-xs text-zinc-500 truncate" title={stats.lastLoginAt ? formatViDateTime(stats.lastLoginAt) : undefined}>
              Gần nhất: {stats.lastLoginAt ? formatViDate(stats.lastLoginAt) : "Chưa ghi nhận"}
            </p>
          </div>

          <div className="wewin-card-3d p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Kỹ năng yếu
              </span>
              <AlertCircle
                className={`h-4 w-4 ${
                  report?.weakSkills.length ? "text-red-600" : "text-zinc-400"
                }`}
              />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${
                report?.weakSkills.length ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {report?.weakSkills.length
                ? report.weakSkills.join(", ")
                : "Không có"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {report?.weakSkills.length
                ? "Cần chú ý bồi dưỡng"
                : "Tiến độ ổn định"}
            </p>
          </div>
        </section>

        {/* SECTION 1: TỔNG HỢP ĐIỂM THEO TỪNG ĐỀ THI */}
        <section className="space-y-4" id="test-summary">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
                <Award className="h-5 w-5 text-wewin-navy" />
                Tổng hợp kết quả theo từng Test
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Hiển thị kết quả cuối cùng (lần nộp gần nhất), điểm cao nhất và số lần làm của học viên theo từng đề thi.
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-500">
              {testSummaries.length} đề thi
            </span>
          </div>

          {testSummaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              Học viên chưa thực hiện đề thi nào.
            </div>
          ) : (
            <div className="wewin-card-3d overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="p-3.5">Đề thi</th>
                    <th className="p-3.5">Kỹ năng</th>
                    <th className="p-3.5">
                      <span className="text-wewin-navy">Kết quả cuối cùng</span>
                      <span className="block text-[10px] font-normal text-zinc-400">
                        (Số câu đúng / Tổng)
                      </span>
                    </th>
                    <th className="p-3.5">
                      Thời gian làm
                      <span className="block text-[10px] font-normal text-zinc-400">
                        (Lần làm cuối)
                      </span>
                    </th>
                    <th className="p-3.5">
                      Điểm cao nhất
                      <span className="block text-[10px] font-normal text-zinc-400">
                        (Best score)
                      </span>
                    </th>
                    <th className="p-3.5 text-center">
                      Số lần làm
                      <span className="block text-[10px] font-normal text-zinc-400">
                        (Đã nộp / Tổng)
                      </span>
                    </th>
                    <th className="p-3.5">Thời điểm nộp cuối</th>
                    <th className="p-3.5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {testSummaries.map((summary) => (
                    <tr
                      key={summary.testSlug}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="p-3.5 font-medium text-zinc-900">
                        <p className="font-semibold">{summary.testTitle}</p>
                        <p className="text-xs text-zinc-400 font-mono">
                          {summary.testSlug}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${skillBadgeClass(
                            summary.skill,
                          )}`}
                        >
                          {summary.skill || "Chưa rõ"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {summary.latestStatus === "UNFINISHED" ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Đang làm dở
                          </span>
                        ) : summary.latestCorrect != null &&
                          summary.latestTotal != null ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-base font-bold text-wewin-navy">
                              {summary.latestCorrect}/{summary.latestTotal}
                              <span className="text-xs font-normal text-zinc-500">
                                câu đúng
                              </span>
                            </span>
                            <div className="text-xs font-semibold text-emerald-700">
                              {summary.latestPercent != null
                                ? `(${summary.latestPercent}%)`
                                : ""}
                              {summary.latestBand != null
                                ? ` · Band ${summary.latestBand}`
                                : ""}
                            </div>
                          </div>
                        ) : summary.latestBand != null ? (
                          <span className="text-base font-bold text-wewin-navy">
                            Band {summary.latestBand}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-zinc-800">
                          {summary.latestDurationLabel}
                        </span>
                        {summary.totalTimeSeconds > 0 &&
                        summary.totalAttempts > 1 ? (
                          <p className="text-[11px] text-zinc-400">
                            Tổng các lần: {summary.totalTimeLabel}
                          </p>
                        ) : null}
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
                            Band {summary.bestBand}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-800">
                          {summary.totalAttempts} lần
                        </span>
                        {summary.totalAttempts > summary.finishedAttempts ? (
                          <p className="mt-0.5 text-[10px] text-amber-600 font-medium">
                            {summary.finishedAttempts} nộp ·{" "}
                            {summary.totalAttempts - summary.finishedAttempts} dở
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3.5 text-xs text-zinc-600">
                        {formatViDateTime(
                          summary.latestFinishedAt || summary.latestStartedAt,
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={summary.latestResultHref}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-wewin-navy hover:underline"
                        >
                          Xem bài làm
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 2: TOÀN BỘ LỊCH SỬ LÀM BÀI CHI TIẾT */}
        <section className="space-y-4" id="attempts-history">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
                <History className="h-5 w-5 text-wewin-navy" />
                Toàn bộ lịch sử làm bài ({attempts.length} lượt)
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Chi tiết từng lần bắt đầu làm bài, thời gian nộp bài, thời lượng thực tế và điểm số từng lượt.
              </p>
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              Chưa có dữ liệu bài làm nào.
            </div>
          ) : (
            <div className="wewin-card-3d overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="p-3.5">Lượt</th>
                    <th className="p-3.5">Đề thi</th>
                    <th className="p-3.5">Kỹ năng / Chế độ</th>
                    <th className="p-3.5">Điểm số / Kết quả</th>
                    <th className="p-3.5">Thời gian bắt đầu</th>
                    <th className="p-3.5">Thời gian nộp</th>
                    <th className="p-3.5">Thời lượng làm</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {attempts.map((att, idx) => (
                    <tr
                      key={att.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="p-3.5 text-xs font-bold text-zinc-400">
                        #{attempts.length - idx}
                      </td>
                      <td className="p-3.5 font-medium text-zinc-900">
                        <p className="font-semibold">{att.testTitle}</p>
                        <p className="text-xs text-zinc-400 font-mono">
                          {att.testSlug}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {att.skill ? (
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${skillBadgeClass(
                                att.skill,
                              )}`}
                            >
                              {att.skill}
                            </span>
                          ) : null}
                          <span className="text-xs text-zinc-500">
                            {att.mode === "PRACTICE" ? "Luyện tập" : "Full test"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {att.status === "UNFINISHED" ? (
                          <span className="text-xs font-semibold text-amber-700">
                            Chưa nộp bài
                          </span>
                        ) : att.scoreCorrect != null && att.scoreTotal != null ? (
                          <div>
                            <span className="font-bold text-zinc-900">
                              {att.scoreCorrect}/{att.scoreTotal}
                            </span>
                            <span className="ml-1 text-xs font-medium text-emerald-700">
                              ({att.scorePercent}%)
                            </span>
                          </div>
                        ) : att.scoreBand != null ? (
                          <span className="font-bold text-zinc-900">
                            Band {att.scoreBand}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-zinc-600 whitespace-nowrap">
                        {formatViDateTime(att.startedAt)}
                      </td>
                      <td className="p-3.5 text-xs text-zinc-600 whitespace-nowrap">
                        {att.finishedAt ? (
                          formatViDateTime(att.finishedAt)
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs font-semibold text-zinc-700 whitespace-nowrap">
                        {att.durationLabel}
                      </td>
                      <td className="p-3.5">
                        {att.status === "FINISHED" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Đã nộp bài
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                            Đang làm
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Link
                          href={att.resultHref}
                          className="font-semibold text-wewin-navy hover:underline text-xs"
                        >
                          {att.status === "FINISHED" ? "Xem kết quả" : "Mở bài"} →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 3: LỊCH SỬ ĐĂNG NHẬP */}
        <section className="space-y-4" id="login-history">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
                <Laptop className="h-5 w-5 text-wewin-navy" />
                Lịch sử đăng nhập ({logins.length} lần gần nhất)
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Nhật ký các lần học viên đăng nhập vào hệ thống, bao gồm mốc thời gian, thiết bị/trình duyệt và địa chỉ IP.
              </p>
            </div>
          </div>

          {logins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              Chưa có nhật ký đăng nhập nào được ghi nhận cho học viên này.
            </div>
          ) : (
            <div className="wewin-card-3d overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="p-3.5">Thời gian đăng nhập</th>
                    <th className="p-3.5">Thiết bị & Trình duyệt</th>
                    <th className="p-3.5">Địa chỉ IP</th>
                    <th className="p-3.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {logins.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="p-3.5 font-medium text-zinc-900 whitespace-nowrap">
                        {formatViDateTime(item.createdAt)}
                      </td>
                      <td className="p-3.5 text-zinc-700">
                        {item.device || "Không rõ thiết bị"}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-zinc-600">
                        {item.ipAddress || "—"}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Thành công
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 4: TIẾN ĐỘ THEO KỸ NĂNG & TỪNG PART (GIỮ LẠI NỘI DUNG GỐC) */}
        {report?.skills?.length ? (
          <section className="space-y-4" id="skill-progress">
            <div className="border-b border-zinc-200 pb-2">
              <h2 className="flex items-center gap-2 text-xl font-bold text-wewin-navy">
                <TrendingUp className="h-5 w-5 text-wewin-navy" />
                Tiến độ kỹ năng & từng Part
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Thống kê điểm trung bình 3 lần làm gần nhất và trạng thái hoàn thành từng Part của 4 kỹ năng.
              </p>
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
                    <div className="flex items-center justify-between border-b bg-zinc-50 px-4 py-3">
                      <div>
                        <h3 className="font-bold text-wewin-navy">
                          {skill.skill}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {skill.completedParts} part đã hoàn thành ·{" "}
                          {activeParts.length - skill.completedParts} part đang làm
                        </p>
                      </div>
                      <span
                        className={`text-sm ${
                          skill.weak
                            ? "font-bold text-red-700"
                            : "font-semibold text-zinc-700"
                        }`}
                      >
                        {skill.average == null
                          ? "Chưa có điểm"
                          : `${skill.average}${
                              ["LISTENING", "READING"].includes(skill.skill)
                                ? "%"
                                : " band"
                            }`}
                      </span>
                    </div>
                    <div className="max-h-[28rem] overflow-auto">
                      {activeParts.length ? (
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 bg-white text-xs text-zinc-500 border-b">
                            <tr>
                              <th className="p-3">Part</th>
                              <th className="p-3">Trạng thái</th>
                              <th className="p-3">Điểm TB</th>
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
                                  {statusLabel[part.status]}
                                </td>
                                <td className="p-3 text-zinc-600">
                                  {part.average ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="px-4 py-8 text-center text-sm text-zinc-500">
                          Chưa có part nào được bắt đầu.
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
