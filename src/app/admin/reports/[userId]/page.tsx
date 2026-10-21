import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { getAdminUserReport } from "@/lib/admin/reports";
import { requireStaffPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

const statusLabel = { NOT_STARTED: "Chưa làm", IN_PROGRESS: "Đang làm", COMPLETED: "Đã làm", WEAK: "Yếu" } as const;

export default async function AdminUserReportPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireStaffPage();
  const { userId } = await params;
  const report = await getAdminUserReport(userId);
  if (!report) notFound();
  return <SiteShell active="admin-reports">
    <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
      <div><Link href="/admin/reports" className="text-sm font-semibold text-wewin-navy hover:underline">← Báo cáo học viên</Link><h1 className="mt-3 text-2xl font-bold text-wewin-navy">{report.user.fullName || report.user.username}</h1><p className="text-sm text-zinc-600">{report.user.username} · {report.user.email || "Không có email"} · {report.user.classCode || "Chưa có lớp"}</p></div>
      <section className="grid gap-3 sm:grid-cols-3"><div className="wewin-card-3d p-4"><p className="text-sm text-zinc-500">Bài hoàn thành</p><p className="text-3xl font-bold">{report.finishedAttempts}</p></div><div className="wewin-card-3d p-4"><p className="text-sm text-zinc-500">Bài đang làm</p><p className="text-3xl font-bold">{report.unfinishedAttempts}</p></div><div className="wewin-card-3d p-4"><p className="text-sm text-zinc-500">Kỹ năng yếu</p><p className="mt-1 font-bold text-red-700">{report.weakSkills.join(", ") || "Không có"}</p></div></section>
      <div className="grid gap-5 xl:grid-cols-2">{report.skills.map((skill) => {
        const activeParts = skill.parts.filter((part) => part.status !== "NOT_STARTED");
        return <section key={skill.skill} className="wewin-card-3d overflow-hidden"><div className="flex items-center justify-between border-b bg-zinc-50 px-4 py-3"><div><h2 className="font-bold text-wewin-navy">{skill.skill}</h2><p className="text-xs text-zinc-500">{skill.completedParts} part đã hoàn thành · {activeParts.length - skill.completedParts} part đang làm</p></div><span className={skill.weak ? "font-bold text-red-700" : "font-semibold text-zinc-700"}>{skill.average == null ? "Chưa có điểm" : `${skill.average}${["LISTENING", "READING"].includes(skill.skill) ? "%" : " band"}`}</span></div><div className="max-h-[32rem] overflow-auto">{activeParts.length ? <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-zinc-500"><tr><th className="p-3">Part</th><th className="p-3">Trạng thái</th><th className="p-3">Điểm TB</th></tr></thead><tbody>{activeParts.map((part) => <tr key={part.key} className="border-t"><td className="p-3">{part.label}</td><td className={`p-3 font-semibold ${part.status === "WEAK" ? "text-red-700" : part.status === "COMPLETED" ? "text-emerald-700" : "text-amber-700"}`}>{statusLabel[part.status]}</td><td className="p-3">{part.average ?? "—"}</td></tr>)}</tbody></table> : <p className="px-4 py-8 text-center text-sm text-zinc-500">Chưa có part nào được bắt đầu.</p>}</div></section>;
      })}</div>
    </main>
  </SiteShell>;
}
