"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type {
  LearnExercise,
  LearnExerciseType,
  LearnLesson,
  LearnSkill,
} from "@/lib/learn/types";
import {
  LEARN_SKILLS,
} from "@/lib/learn/types";
import { useTranslations } from "@/i18n/provider";

type DraftExercise = {
  key: string;
  id: string;
  type: LearnExerciseType;
  prompt: string;
  /** One option per line for MCQ */
  optionsText: string;
  /** Comma or newline separated accepted answers */
  answersText: string;
};

type CourseOption = { id: string; title: string };

type Props = {
  mode: "create" | "edit";
  lesson?: LearnLesson;
  /** Suggested next order when creating for a skill */
  defaultSkill?: LearnSkill;
  defaultOrder?: number;
  defaultCourseId?: string;
  courses?: CourseOption[];
};

function toDraft(ex: LearnExercise, index: number): DraftExercise {
  return {
    key: ex.id || `new-${index}-${Math.random().toString(36).slice(2, 7)}`,
    id: ex.id,
    type: ex.type,
    prompt: ex.prompt,
    optionsText: (ex.options ?? []).join("\n"),
    answersText: ex.answers.join(", "),
  };
}

function emptyDraft(index: number): DraftExercise {
  return {
    key: `new-${index}-${Math.random().toString(36).slice(2, 7)}`,
    id: "",
    type: "multiple_choice",
    prompt: "",
    optionsText: "A. \nB. \nC. \nD. ",
    answersText: "A",
  };
}

function draftsToExercises(drafts: DraftExercise[]): LearnExercise[] {
  return drafts.map((d, i) => {
    const answers = d.answersText
      .split(/[\n,;]+/)
      .map((a) => a.trim())
      .filter(Boolean);
    const options =
      d.type === "multiple_choice"
        ? d.optionsText
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    return {
      id: d.id.trim() || `q${i + 1}`,
      type: d.type,
      prompt: d.prompt.trim(),
      ...(options ? { options } : {}),
      answers,
    };
  });
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-800";

export function LearnLessonForm({
  mode,
  lesson,
  defaultSkill = "listening",
  defaultOrder = 1,
  defaultCourseId,
  courses = [],
}: Props) {
  const router = useRouter();
  const { t } = useTranslations("learnAdmin");
  const { t: ts } = useTranslations("skills");
  const { t: te } = useTranslations("exerciseTypes");
  const { t: tc } = useTranslations("common");
  const { t: tl } = useTranslations("learn");
  const [courseId, setCourseId] = useState(
    defaultCourseId ?? courses[0]?.id ?? "",
  );
  const [skill, setSkill] = useState<LearnSkill>(
    lesson?.skill ?? defaultSkill,
  );
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [order, setOrder] = useState(lesson?.order ?? defaultOrder);
  const [summary, setSummary] = useState(lesson?.summary ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState(
    lesson?.durationSec ? String(lesson.durationSec) : "",
  );
  const [exercises, setExercises] = useState<DraftExercise[]>(() =>
    lesson?.exercises?.length
      ? lesson.exercises.map(toDraft)
      : [emptyDraft(0)],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateExercise(key: string, patch: Partial<DraftExercise>) {
    setExercises((prev) =>
      prev.map((ex) => (ex.key === key ? { ...ex, ...patch } : ex)),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const form = new FormData();
    if (courseId) form.append("courseId", courseId);
    form.append("skill", skill);
    form.append("title", title);
    form.append("order", String(order));
    form.append("summary", summary);
    form.append("videoUrl", videoUrl);
    if (durationSec.trim()) form.append("durationSec", durationSec.trim());
    form.append("exercises", JSON.stringify(draftsToExercises(exercises)));
    if (videoFile) form.append("videoFile", videoFile);
    if (mode === "edit" && lesson) form.append("id", lesson.id);

    try {
      const url =
        mode === "create" ? "/api/admin/learn" : `/api/admin/learn/${lesson!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        lesson?: LearnLesson;
        editUrl?: string;
        learnUrl?: string;
      };
      if (!res.ok) {
        setError(data.error ?? t("saveFailed"));
        return;
      }
      if (mode === "create" && data.editUrl) {
        setSuccess(t("created"));
        router.push(data.editUrl);
        router.refresh();
        return;
      }
      setSuccess(data.learnUrl ? t("saved") : t("saved"));
      if (data.lesson) {
        setVideoUrl(data.lesson.videoUrl);
        setVideoFile(null);
        setExercises(data.lesson.exercises.map(toDraft));
      }
      router.refresh();
    } catch {
      setError(t("networkRetry"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="card-outline p-5 sm:p-6">
        <h2 className="text-base font-bold text-zinc-900">{t("sectionInfo")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {courses.length > 0 ? (
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="courseId">
                {t("colCourse", "Khóa học")}
              </label>
              <select
                id="courseId"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className={inputClass}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className={labelClass} htmlFor="skill">
              {t("colSkill")}
            </label>
            <select
              id="skill"
              value={skill}
              onChange={(e) => setSkill(e.target.value as LearnSkill)}
              className={inputClass}
              required
            >
              {LEARN_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {ts(s)} ({ts(`vi.${s}`)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="order">
              {t("order")}
            </label>
            <input
              id="order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className={inputClass}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t("orderHint")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="title">
              {t("title")}
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder={t("phTitle")}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="summary">
              {t("summaryOptional")}
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder={t("phSummary")}
            />
          </div>
        </div>
      </div>

      <div className="card-outline p-5 sm:p-6">
        <h2 className="text-base font-bold text-zinc-900">{t("sectionVideo")}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Upload file (.mp4 / .webm) hoặc dán URL công khai. Upload sẽ ghi đè
          URL.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass} htmlFor="videoFile">
              {t("uploadVideo")}
            </label>
            <input
              id="videoFile"
              type="file"
              accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg,.mov"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-wewin-accent-blue-bg file:px-3 file:py-2 file:text-sm file:font-semibold file:text-wewin-navy hover:file:bg-wewin-accent-blue-bg"
            />
            {videoFile ? (
              <p className="mt-1 text-xs text-zinc-500">
                {t("fileChosen", { file: videoFile.name })} (
                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            ) : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="videoUrl">
              {t("orVideoUrl")}
            </label>
            <input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={inputClass}
              placeholder={t("phUrl")}
            />
            {mode === "edit" && videoUrl ? (
              <p className="mt-1 truncate text-xs text-zinc-500">
                Hiện tại: {videoUrl}
              </p>
            ) : null}
          </div>
          <div className="max-w-xs">
            <label className={labelClass} htmlFor="durationSec">
              {t("durationHint")}
            </label>
            <input
              id="durationSec"
              type="number"
              min={1}
              value={durationSec}
              onChange={(e) => setDurationSec(e.target.value)}
              className={inputClass}
              placeholder={t("phDuration")}
            />
          </div>
        </div>
      </div>

      <div className="card-outline p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">{t("sectionExercises")}</h2>
            <p className="mt-1 text-sm text-zinc-600">{t("exercisesHint")}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setExercises((prev) => [...prev, emptyDraft(prev.length)])
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            <Plus className="h-4 w-4" />
            {t("addQuestion")}
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {exercises.map((ex, index) => (
            <div
              key={ex.key}
              className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-800">
                  {tl("questionN", { n: index + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setExercises((prev) =>
                      prev.length <= 1
                        ? prev
                        : prev.filter((x) => x.key !== ex.key),
                    )
                  }
                  disabled={exercises.length <= 1}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" />
                  {tc("delete")}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("qType")}</label>
                  <select
                    value={ex.type}
                    onChange={(e) =>
                      updateExercise(ex.key, {
                        type: e.target.value as LearnExerciseType,
                        optionsText:
                          e.target.value === "multiple_choice" &&
                          !ex.optionsText.trim()
                            ? "A. \nB. \nC. \nD. "
                            : ex.optionsText,
                      })
                    }
                    className={inputClass}
                  >
                    {(
                      ["multiple_choice", "short_answer", "gap_fill"] as LearnExerciseType[]
                    ).map((typeKey) => (
                      <option key={typeKey} value={typeKey}>
                        {te(typeKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("qPrompt")}</label>
                  <textarea
                    value={ex.prompt}
                    onChange={(e) =>
                      updateExercise(ex.key, { prompt: e.target.value })
                    }
                    rows={2}
                    className={inputClass}
                    required
                  />
                </div>
                {ex.type === "multiple_choice" ? (
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      {t("qOptions")}
                    </label>
                    <textarea
                      value={ex.optionsText}
                      onChange={(e) =>
                        updateExercise(ex.key, {
                          optionsText: e.target.value,
                        })
                      }
                      rows={4}
                      className={`${inputClass} font-mono text-xs`}
                      required
                    />
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    {t("qAnswers")}
                  </label>
                  <input
                    value={ex.answersText}
                    onChange={(e) =>
                      updateExercise(ex.key, {
                        answersText: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder={t("phAnswers")}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700">{success}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? t("createLesson") : t("saveChanges")}
        </button>
        <Link
          href="/admin/learn"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          {t("backList")}
        </Link>
        {mode === "edit" && lesson ? (
          <Link
            href={
              courseId
                ? `/learn/${courseId}/${lesson.skill}/${lesson.id}`
                : `/learn/${lesson.skill}/${lesson.id}`
            }
            className="text-sm font-medium text-wewin-navy hover:underline"
            target="_blank"
          >
            {t("viewLearnerPage")}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
