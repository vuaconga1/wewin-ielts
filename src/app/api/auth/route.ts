import { NextResponse } from "next/server";
import {
  AuthError,
  loginWithEmailPassword,
  destroySession,
  getSessionUser,
  canAccessAdmin,
} from "@/lib/auth";
import { getUserAvatarUrl } from "@/lib/user-profile";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { user: null, canImport: canAccessAdmin(null) },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  const avatarUrl = await getUserAvatarUrl(user.id);
  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl,
      },
      canImport: canAccessAdmin(user),
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
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
    const avatarUrl = await getUserAvatarUrl(user.id);
    return NextResponse.json({
      user: { ...user, avatarUrl },
      canImport: canAccessAdmin(user),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
