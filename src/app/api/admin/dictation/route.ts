import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  createDictation,
  listDictationsForAdmin,
  type DictationInput,
} from "@/lib/dictation/store";
import { dictationErrorResponse } from "@/lib/dictation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    return NextResponse.json({ exercises: await listDictationsForAdmin() });
  } catch (err) {
    return dictationErrorResponse(err, "admin/dictation");
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const body = (await request.json()) as DictationInput;
    const row = await createDictation(body);
    return NextResponse.json({ ok: true, ...row });
  } catch (err) {
    return dictationErrorResponse(err, "admin/dictation");
  }
}
