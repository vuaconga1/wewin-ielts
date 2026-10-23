import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";
import { deleteZoomAccount, updateZoomAccount } from "@/lib/zoom/accounts";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const account = await updateZoomAccount(id, await request.json().catch(() => null));
    await recordAuditEvent({
      actor: auth.actor,
      action: "ZOOM_ACCOUNT_UPDATE",
      request,
      metadata: { zoomAccountId: id, name: account.name },
    });
    return NextResponse.json({ account }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-accounts");
  }
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    await deleteZoomAccount(id);
    await recordAuditEvent({
      actor: auth.actor,
      action: "ZOOM_ACCOUNT_DELETE",
      request,
      metadata: { zoomAccountId: id },
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-accounts");
  }
}
