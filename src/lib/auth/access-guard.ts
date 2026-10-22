import { NextResponse } from "next/server";
import { canUseLearningFeatures } from "@/lib/access";
import { isLearnerRole } from "@/lib/auth/permissions";

export async function expiredAccessResponse(user: { id: string; role: string } | null) {
  if (!user || !isLearnerRole(user.role)) return null;
  if (await canUseLearningFeatures(user.id)) return null;
  return NextResponse.json(
    { error: "Tài khoản đã hết hạn. Vui lòng liên hệ quản trị viên để gia hạn.", code: "ACCOUNT_EXPIRED" },
    { status: 403 },
  );
}
