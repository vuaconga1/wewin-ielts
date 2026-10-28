import { NextResponse } from "next/server";
import { loadHomeworkCatalog } from "@/lib/classroom/homework";
import { manageErrorResponse, requireClassStaff } from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

/** Tests (with parts) teachers can assign as homework. */
export async function GET() {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  try {
    const items = await loadHomeworkCatalog();
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    return manageErrorResponse(error, "admin-class-catalog");
  }
}
