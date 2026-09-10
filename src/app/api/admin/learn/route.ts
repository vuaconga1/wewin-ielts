import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import { parseLessonFormData } from "@/lib/learn/admin-form";
import {
  learnCourseHref,
  learnLessonHref,
  learnSkillHref,
} from "@/lib/learn/hrefs";
import {
  LearnStoreError,
  createCourse,
  createLesson,
  getCatalog,
  getLessonContext,
  resetCurriculumToSeed,
} from "@/lib/learn/store";
import type { LearnSkill } from "@/lib/learn/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertAdminAccess() {
  return requireAdminResponse(getSessionUser);
}

function revalidateLearnPaths(
  courseId?: string,
  skill?: string,
  lessonId?: string,
) {
  revalidatePath("/learn");
  revalidatePath("/admin/learn");
  if (courseId) {
    revalidatePath(learnCourseHref(courseId));
    if (skill) {
      revalidatePath(learnSkillHref(courseId, skill as LearnSkill));
      if (lessonId) {
        revalidatePath(
          learnLessonHref(courseId, skill as LearnSkill, lessonId),
        );
      }
    }
  }
}

export async function GET() {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;
    const catalog = await getCatalog();
    return NextResponse.json({ catalog });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;

    const form = await request.formData();
    const action = String(form.get("action") ?? "create");

    if (action === "reset-seed") {
      const catalog = await resetCurriculumToSeed();
      revalidateLearnPaths();
      return NextResponse.json({
        ok: true,
        catalog,
        message: "Đã khôi phục nội dung mẫu (seed).",
      });
    }

    if (action === "create-course") {
      const course = await createCourse({
        id: String(form.get("id") ?? ""),
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        level: String(form.get("level") ?? ""),
      });
      revalidateLearnPaths(course.id);
      return NextResponse.json({ ok: true, course });
    }

    const input = await parseLessonFormData(form);
    const lesson = await createLesson(input);
    const ctx = await getLessonContext(lesson.id);
    const courseId = ctx?.course.id ?? input.courseId;
    revalidateLearnPaths(courseId, lesson.skill, lesson.id);
    return NextResponse.json({
      ok: true,
      lesson,
      courseId,
      editUrl: `/admin/learn/${lesson.id}`,
      learnUrl: courseId
        ? learnLessonHref(courseId, lesson.skill, lesson.id)
        : undefined,
    });
  } catch (e) {
    if (e instanceof LearnStoreError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: 400 },
      );
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
