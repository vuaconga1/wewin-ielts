import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  createShadowing,
  listShadowingForAdmin,
  type ShadowingInput,
} from "@/lib/shadowing/store";
import { shadowingErrorResponse } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    return NextResponse.json({ exercises: await listShadowingForAdmin() });
  } catch (err) {
    return shadowingErrorResponse(err, "admin/shadowing");
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const body = (await request.json()) as ShadowingInput;
    const row = await createShadowing(body);
    return NextResponse.json({ ok: true, ...row });
  } catch (err) {
    return shadowingErrorResponse(err, "admin/shadowing");
  }
}
