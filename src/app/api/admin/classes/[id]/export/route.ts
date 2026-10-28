import { getTranslations } from "@/i18n/server";
import { prisma } from "@/lib/prisma";
import { buildProgressCsv, loadClassProgress } from "@/lib/classroom/homework";
import { utcToZonedWallTime } from "@/lib/classroom/schedule-time";
import { manageErrorResponse, requireClassStaff } from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "lop"
  );
}

/** GET → progress CSV (UTF-8 BOM so Excel keeps Vietnamese diacritics). */
export async function GET(_request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const [progress, classroom, { t }] = await Promise.all([
      loadClassProgress(auth.actor, id),
      prisma.classroom.findUnique({ where: { id }, select: { code: true, timezone: true } }),
      getTranslations("classHomework"),
    ]);
    const csv = buildProgressCsv(progress, {
      headers: [
        t("csv.test", "Đề"),
        t("csv.parts", "Phần"),
        t("csv.deadline", "Hạn nộp"),
        t("csv.student", "Học viên"),
        t("csv.username", "Username"),
        t("csv.status", "Trạng thái"),
        t("csv.correct", "Đúng"),
        t("csv.band", "Band"),
        t("csv.attempts", "Số lần làm"),
        t("csv.submittedAt", "Thời gian nộp"),
        t("csv.onTime", "Đúng hạn"),
      ],
      done: t("statusDone", "Đã làm"),
      pending: t("statusPending", "Chưa làm"),
      onTime: t("onTime", "Đúng hạn"),
      late: t("late", "Trễ hạn"),
      wholeTest: t("wholeTest", "Cả đề"),
    });
    const today = utcToZonedWallTime(new Date(), classroom?.timezone ?? "Asia/Ho_Chi_Minh").slice(0, 10);
    const filename = `tien-do-${slugify(classroom?.code ?? id)}-${today}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-export");
  }
}
