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
  deleteLesson,
  getLessonContext,
  updateLesson,
} from "@/lib/learn/store";
import type { LearnSkill } from "@/lib/learn/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ lessonId: string }> };

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
  if (lessonId) revalidatePath(`/admin/learn/${lessonId}`);
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;
    const { lessonId } = await ctx.params;
    const found = await getLessonContext(lessonId);
    if (!found) {
      return NextResponse.json(
        { error: "Không tìm thấy bài học" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      lesson: found.lesson,
      courseId: found.course.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;
    const { lessonId } = await ctx.params;
    const existing = await getLessonContext(lessonId);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy bài học" },
        { status: 404 },
      );
    }

    const form = await request.formData();
    const input = await parseLessonFormData(form);
    if (!input.videoUrl) {
      input.videoUrl = existing.lesson.videoUrl;
    }
    const lesson = await updateLesson(lessonId, input);
    const next = await getLessonContext(lessonId);
    const courseId = next?.course.id ?? existing.course.id;
    revalidateLearnPaths(courseId, lesson.skill, lesson.id);
    if (existing.course.id !== courseId || existing.lesson.skill !== lesson.skill) {
      revalidateLearnPaths(
        existing.course.id,
        existing.lesson.skill,
        lesson.id,
      );
    }
    return NextResponse.json({
      ok: true,
      lesson,
      courseId,
      learnUrl: learnLessonHref(courseId, lesson.skill, lesson.id),
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

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;
    const { lessonId } = await ctx.params;
    const ctxLesson = await getLessonContext(lessonId);
    if (!ctxLesson) {
      return NextResponse.json(
        { error: "Không tìm thấy bài học" },
        { status: 404 },
      );
    }
    await deleteLesson(lessonId);
    revalidateLearnPaths(
      ctxLesson.course.id,
      ctxLesson.lesson.skill,
      lessonId,
    );
    return NextResponse.json({ ok: true });
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
