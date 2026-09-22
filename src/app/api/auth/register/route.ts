import { NextResponse } from "next/server";
import { AuthError, canAccessAdmin, registerStudent } from "@/lib/auth";
import { getUserAvatarUrl } from "@/lib/user-profile";

export const runtime = "nodejs";

/** Public student registration — role is always STUDENT. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      username?: string;
    };

    const email = body.email?.trim();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "Nhập email và mật khẩu" },
        { status: 400 },
      );
    }

    const user = await registerStudent({
      email,
      password,
      username: body.username,
    });
    const avatarUrl = await getUserAvatarUrl(user.id);
    return NextResponse.json({
      user: { ...user, avatarUrl },
      canImport: canAccessAdmin(user),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const status = e.code === "EMAIL_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
