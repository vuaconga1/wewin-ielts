import { NextResponse } from "next/server";
import { AuthError, canAccessAdmin, registerStudent } from "@/lib/auth";
import { getUserAvatarUrl } from "@/lib/user-profile";
import { registerBodySchema } from "@/lib/validation/auth";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

/** Public student registration — role is always VISITOR/STUDENT path, never ADMIN. */
export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = parseJsonBody(registerBodySchema, raw);
    if (!parsed.ok) return parsed.response;

    const user = await registerStudent({
      email: parsed.data.email,
      password: parsed.data.password,
      username: parsed.data.username,
    });
    const avatarUrl = await getUserAvatarUrl(user.id);
    return NextResponse.json({
      user: { ...user, avatarUrl },
      canImport: canAccessAdmin(user),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const status = e.code === "EMAIL_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
