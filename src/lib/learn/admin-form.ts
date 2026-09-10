import {
  LearnStoreError,
  type LessonInput,
} from "@/lib/learn/store";
import { saveLearnVideoUpload } from "@/lib/learn/video";
import type { LearnExercise, LearnSkill } from "@/lib/learn/types";
import { isLearnSkill } from "@/lib/learn/types";

function parseExercisesJson(raw: string): LearnExercise[] {
  try {
    const parsed = JSON.parse(raw) as LearnExercise[];
    if (!Array.isArray(parsed)) {
      throw new Error("exercises phải là mảng");
    }
    return parsed;
  } catch (e) {
    throw new LearnStoreError(
      "INVALID_EXERCISE",
      e instanceof Error ? e.message : "JSON bài tập không hợp lệ",
    );
  }
}

/** Parse multipart FormData from admin lesson create/edit forms. */
export async function parseLessonFormData(
  form: FormData,
  opts?: { requireId?: boolean },
): Promise<LessonInput> {
  const skillRaw = String(form.get("skill") ?? "").trim();
  if (!isLearnSkill(skillRaw)) {
    throw new LearnStoreError("INVALID_SKILL", "Chọn kỹ năng hợp lệ");
  }
  const skill = skillRaw as LearnSkill;

  const title = String(form.get("title") ?? "").trim();
  const summary = String(form.get("summary") ?? "").trim();
  const order = Number(form.get("order") ?? 1);
  const durationRaw = form.get("durationSec");
  const durationSec =
    durationRaw != null && String(durationRaw).trim() !== ""
      ? Number(durationRaw)
      : undefined;

  let videoUrl = String(form.get("videoUrl") ?? "").trim();
  const videoFile = form.get("videoFile");
  if (videoFile instanceof File && videoFile.size > 0) {
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const saved = await saveLearnVideoUpload(buffer, videoFile.name);
    videoUrl = saved.relativeUrl;
  }

  const exercisesRaw = String(form.get("exercises") ?? "[]");
  const exercises = parseExercisesJson(exercisesRaw);

  const id = String(form.get("id") ?? "").trim() || undefined;
  if (opts?.requireId && !id) {
    throw new LearnStoreError("INVALID_LESSON", "Thiếu id bài học");
  }

  const courseId = String(form.get("courseId") ?? "").trim() || undefined;

  return {
    id,
    courseId,
    skill,
    title,
    order,
    summary,
    videoUrl,
    durationSec:
      typeof durationSec === "number" && Number.isFinite(durationSec)
        ? durationSec
        : undefined,
    exercises,
  };
}
