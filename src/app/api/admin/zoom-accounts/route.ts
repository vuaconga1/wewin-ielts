import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";
import { createZoomAccount, listZoomAccounts } from "@/lib/zoom/accounts";

export const runtime = "nodejs";

/** GET/POST /api/admin/zoom-accounts — ADMIN only; secrets are never returned. */
export async function GET() {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json({ accounts: await listZoomAccounts() }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-accounts");
  }
}

export async function POST(request: Request) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  try {
    const account = await createZoomAccount(await request.json().catch(() => null));
    await recordAuditEvent({
      actor: auth.actor,
      action: "ZOOM_ACCOUNT_CREATE",
      request,
      metadata: { zoomAccountId: account.id, name: account.name },
    });
    return NextResponse.json({ account }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-accounts");
  }
}
