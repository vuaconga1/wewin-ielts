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
      password?: string;
      action?: "login" | "logout";
    };

    if (body.action === "logout") {
      await destroySession();
      return NextResponse.json({ ok: true });
    }

    const email = body.email?.trim();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "Nhập email và mật khẩu" },
        { status: 400 },
      );
    }

    const user = await loginWithEmailPassword(email, password);
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
