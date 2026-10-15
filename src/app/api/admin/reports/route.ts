import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import { buildAdminReports } from "@/lib/admin/reports";

export async function GET() {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  return NextResponse.json({ reports: await buildAdminReports() });
}
