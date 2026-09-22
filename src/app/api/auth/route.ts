import { NextResponse } from "next/server";
import {
  AuthError,
  loginWithEmailPassword,
  destroySession,
  getSessionUser,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      username?: string;
      password?: string;
      action?: "login" | "logout";
    };

    if (body.action === "logout") {
      await destroySession();
      return NextResponse.json({ ok: true });
    }

    const identifier = (body.email ?? body.username ?? "").trim();
    const password = body.password ?? "";
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Nhập email/username và mật khẩu" },
        { status: 400 },
      );
    }

    const user = await loginWithEmailPassword(identifier, password);
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
