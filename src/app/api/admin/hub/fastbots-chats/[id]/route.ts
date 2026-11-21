import { NextResponse } from "next/server";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { getFastbotsConversationDetail } from "@/lib/fastbots/store";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { code: "LOGIN_REQUIRED" },
      { status: 401, headers: NO_STORE },
    );
  }
  if (!canAccessAdmin(user)) {
    return NextResponse.json(
      { code: "ADMIN_REQUIRED" },
      { status: 403, headers: NO_STORE },
    );
  }

  const { id } = await params;
  if (!id || id.length > 80) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const detail = await getFastbotsConversationDetail(id);
    if (!detail) {
      return NextResponse.json(
        { code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE },
      );
    }
    return NextResponse.json(detail, { headers: NO_STORE });
  } catch (error) {
    console.error("[admin/hub/fastbots-chats/:id]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
