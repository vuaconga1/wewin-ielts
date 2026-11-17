import { NextResponse } from "next/server";
import {
  AuthError,
  loginWithEmailPassword,
  destroySession,
  getSessionUser,
  canAccessAdmin,
} from "@/lib/auth";
import { getUserDisplayProfile } from "@/lib/user-profile";
import { getUserAccess } from "@/lib/access";
import { recordAuditEvent } from "@/lib/audit-log";
import { loginBodySchema } from "@/lib/validation/auth";
import { parseJsonBody } from "@/lib/validation/http";

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

  const profile = await getUserDisplayProfile(user.id);
  const access = await getUserAccess(user.id);

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: profile.fullName ?? user.fullName ?? null,
        role: profile.role ?? user.role,
        avatarUrl: profile.avatarUrl,
        accessPlan: access?.accessPlan ?? "UNLIMITED",
        accessExpiresAt: access?.accessExpiresAt
          ? access.accessExpiresAt.toISOString()
          : null,
        accessStatus: access?.status ?? "UNLIMITED",
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
    const raw = await request.json().catch(() => null);
    const body = (raw ?? {}) as {
      email?: string;
      username?: string;
      password?: string;
      action?: "login" | "logout";
    };

    if (body.action === "logout") {
      const currentUser = await getSessionUser();
      if (currentUser) {
        await recordAuditEvent({ actor: currentUser, action: "LOGOUT", request });
      }
      await destroySession();
      return NextResponse.json({ ok: true });
    }

    const parsed = parseJsonBody(loginBodySchema, {
      action: "login" as const,
      email: body.email,
      username: body.username,
      password: body.password,
    });
    if (!parsed.ok) return parsed.response;

    const identifier = (parsed.data.email ?? parsed.data.username ?? "").trim();
    const user = await loginWithEmailPassword(identifier, parsed.data.password);
    await recordAuditEvent({ actor: user, action: "LOGIN", request });
    const profile = await getUserDisplayProfile(user.id);
    const access = await getUserAccess(user.id);

    return NextResponse.json({
      user: {
        ...user,
        fullName: profile.fullName ?? user.fullName,
        avatarUrl: profile.avatarUrl,
        accessPlan: access?.accessPlan ?? "UNLIMITED",
        accessExpiresAt: access?.accessExpiresAt
          ? access.accessExpiresAt.toISOString()
          : null,
        accessStatus: access?.status ?? "UNLIMITED",
      },
      canImport: canAccessAdmin(user),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
