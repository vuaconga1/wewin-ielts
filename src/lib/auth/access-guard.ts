import { NextResponse } from "next/server";
import { canUseLearningFeatures } from "@/lib/access";

export async function expiredAccessResponse(user: { id: string; role: string } | null) {
  if (!user || user.role !== "STUDENT") return null;
  if (await canUseLearningFeatures(user.id)) return null;
  return NextResponse.json(
    { error: "Tài khoản đã hết hạn. Vui lòng liên hệ quản trị viên để gia hạn.", code: "ACCOUNT_EXPIRED" },
    { status: 403 },
  );
}
