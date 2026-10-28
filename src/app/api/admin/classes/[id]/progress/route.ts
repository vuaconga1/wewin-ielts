import { NextResponse } from "next/server";
import { loadClassProgress } from "@/lib/classroom/homework";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const progress = await loadClassProgress(auth.actor, id);
    return NextResponse.json(progress, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-progress");
  }
}
