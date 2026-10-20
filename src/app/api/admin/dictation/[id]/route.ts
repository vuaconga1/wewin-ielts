import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  deleteDictation,
  updateDictation,
  type DictationInput,
} from "@/lib/dictation/store";
import { dictationErrorResponse } from "@/lib/dictation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await request.json()) as DictationInput;
    const row = await updateDictation(id, body);
    return NextResponse.json({ ok: true, ...row });
  } catch (err) {
    return dictationErrorResponse(err, "admin/dictation");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteDictation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dictationErrorResponse(err, "admin/dictation");
  }
}
