import { NextResponse } from "next/server";
import { getSessionUser, requireStaffResponse } from "@/lib/auth";
import { getUserDetailReport } from "@/lib/admin/user-detail";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const denied = await requireStaffResponse(getSessionUser);
  if (denied) return denied;
  const { userId } = await context.params;
  const data = await getUserDetailReport(userId);
  return data
    ? NextResponse.json(data)
    : NextResponse.json({ error: "Không tìm thấy học viên" }, { status: 404 });
}
