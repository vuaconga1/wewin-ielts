import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Video } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { getSessionUser } from "@/lib/auth";
import { listClassroomSessionsForUser } from "@/lib/classroom/access";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

const STATUS_KEYS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  ENDED: "ended",
  CANCELLED: "cancelled",
} as const;
const STATUS_FALLBACKS = {
  SCHEDULED: "Sắp diễn ra",
  LIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
} as const;

export default async function ClassroomListPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect(`/login?next=${encodeURIComponent("/classroom")}`);
  const [{ locale, t }, sessions] = await Promise.all([
    getTranslations("classroom"),
    listClassroomSessionsForUser(viewer.id),
  ]);
  const formatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <SiteShell active="classroom">
      <main className="mx-auto w-full max-w-5xl min-w-0 px-4 py-8 sm:px-6">
        <div className="mb-7">
          <h1 className="break-words text-2xl font-bold text-wewin-navy sm:text-3xl">
            {t("title", "Lớp học của tôi")}
          </h1>
          <p className="mt-2 break-words text-sm text-zinc-600">
            {t("subtitle", "Tham gia các buổi học trực tuyến đã được phân công.")}
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-wewin-border bg-white p-8 text-center text-zinc-600">
            {t("empty", "Chưa có buổi học trực tuyến nào.")}
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="min-w-0 rounded-2xl border border-wewin-border bg-white p-5 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold uppercase tracking-wide text-wewin-blue">
                      {session.classroom.name} · {session.classroom.code}
                    </p>
                    <h2 className="mt-1 break-words text-lg font-bold text-wewin-navy">
                      {session.title}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-wewin-blue">
                    {t(
                      STATUS_KEYS[session.status],
                      STATUS_FALLBACKS[session.status],
                    )}
                  </span>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="break-words">
                    {formatter.format(session.scheduledStart)}
                  </span>
                </p>
                <Link
                  href={`/classroom/${session.id}`}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-blue"
                >
                  <Video className="h-4 w-4" />
                  {t("join", "Vào lớp học")}
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
