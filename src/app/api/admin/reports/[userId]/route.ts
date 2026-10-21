import { NextResponse } from "next/server";
import { getSessionUser, requireStaffResponse } from "@/lib/auth";
import { getAdminUserReport } from "@/lib/admin/reports";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const denied = await requireStaffResponse(getSessionUser);
  if (denied) return denied;
  const { userId } = await context.params;
  const report = await getAdminUserReport(userId);
  return report
    ? NextResponse.json({ report })
    : NextResponse.json({ error: "Không tìm thấy học viên" }, { status: 404 });
}
