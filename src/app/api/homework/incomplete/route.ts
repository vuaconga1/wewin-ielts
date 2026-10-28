import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isLearnerRole } from "@/lib/auth/roles";
import { listIncompleteHomework } from "@/lib/classroom/homework";

export const runtime = "nodejs";

const PRIVATE_SHORT = { "Cache-Control": "private, max-age=60" };

/** Learner: homework from their active classes that has no qualifying submission yet. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "LOGIN_REQUIRED" }, { status: 401 });
  if (!isLearnerRole(user.role)) {
    return NextResponse.json({ items: [] }, { headers: PRIVATE_SHORT });
  }
  try {
    const items = await listIncompleteHomework(user.id);
    return NextResponse.json(
      { displayName: user.fullName?.trim() || user.username, items },
      { headers: PRIVATE_SHORT },
    );
  } catch (error) {
    console.error("[homework-incomplete]", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
