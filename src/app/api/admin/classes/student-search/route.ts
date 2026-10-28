import { NextResponse } from "next/server";
import { findClassroomsByStudent } from "@/lib/classroom/manage";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

/** GET ?q= → { matches: { [classroomId]: matchedStudentNames[] } } */
export async function GET(request: Request) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const matches = await findClassroomsByStudent(auth.actor, q);
    return NextResponse.json({ matches }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-student-search");
  }
}
