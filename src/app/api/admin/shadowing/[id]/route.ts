import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  deleteShadowing,
  updateShadowing,
  type ShadowingInput,
} from "@/lib/shadowing/store";
import { shadowingErrorResponse } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await request.json()) as ShadowingInput;
    const row = await updateShadowing(id, body);
    return NextResponse.json({ ok: true, ...row });
  } catch (err) {
    return shadowingErrorResponse(err, "admin/shadowing");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteShadowing(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return shadowingErrorResponse(err, "admin/shadowing");
  }
}
