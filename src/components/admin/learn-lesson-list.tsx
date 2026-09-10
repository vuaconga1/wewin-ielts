"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type {
  LearnCatalog,
  LearnLesson,
  LearnSkill,
} from "@/lib/learn/types";
import { LEARN_SKILLS } from "@/lib/learn/types";
import { learnLessonHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type LessonRow = LearnLesson & { courseId: string; courseTitle: string };

type Props = {
  catalog: LearnCatalog;
};

export function LearnLessonList({ catalog }: Props) {
  const router = useRouter();
  const { t } = useTranslations("learnAdmin");
  const { t: ts } = useTranslations("skills");
  const { t: tc } = useTranslations("common");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<LearnSkill | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const allLessons: LessonRow[] = useMemo(() => {
    const rows: LessonRow[] = [];
    for (const course of catalog.courses) {
      for (const lesson of course.lessons) {
        rows.push({
          ...lesson,
          courseId: course.id,
          courseTitle: course.title,
        });
      }
    }
    return rows.sort((a, b) => {
      if (a.courseId !== b.courseId) {
        return a.courseTitle.localeCompare(b.courseTitle);
      }
      if (a.skill !== b.skill) {
        return LEARN_SKILLS.indexOf(a.skill) - LEARN_SKILLS.indexOf(b.skill);
      }
      return a.order - b.order;
    });
  }, [catalog.courses]);

  const lessons = useMemo(() => {
    return allLessons.filter((l) => {
      if (courseFilter !== "all" && l.courseId !== courseFilter) return false;
      if (skillFilter !== "all" && l.skill !== skillFilter) return false;
      return true;
    });
  }, [allLessons, courseFilter, skillFilter]);

  const counts = useMemo(() => {
    const scoped =
      courseFilter === "all"
        ? allLessons
        : allLessons.filter((l) => l.courseId === courseFilter);
    const map: Record<string, number> = { all: scoped.length };
    for (const s of LEARN_SKILLS) {
      map[s] = scoped.filter((l) => l.skill === s).length;
    }
    return map;
  }, [allLessons, courseFilter]);

  async function onDelete(lesson: LessonRow) {
    if (!confirm(t("confirmDelete", { title: lesson.title }))) {
      return;
    }
    setBusyId(lesson.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/learn/${lesson.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("deleteFailed"));
        return;
      }
      setMessage("");
      router.refresh();
    } catch {
      setError(t("networkRetry"));
    } finally {
      setBusyId(null);
    }
  }

  async function onResetSeed() {
    if (!confirm(t("confirmSeed"))) {
      return;
    }
    setResetting(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("action", "reset-seed");
      const res = await fetch("/api/admin/learn", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? t("seedFailed"));
        return;
      }
      setMessage(data.message ?? "");
      router.refresh();
    } catch {
      setError(t("networkRetry"));
    } finally {
      setResetting(false);
    }
  }

  async function onCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setCreatingCourse(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("action", "create-course");
      form.append("title", courseTitle);
      form.append("id", courseId);
      form.append("description", courseDesc);
      form.append("level", courseLevel);
      const res = await fetch("/api/admin/learn", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { error?: string; course?: { title: string } };
      if (!res.ok) {
        setError(data.error ?? t("courseCreateFailed", "Không tạo được khóa học"));
        return;
      }
      setMessage(t("courseCreated", "Đã tạo khóa học."));
      setCourseTitle("");
      setCourseId("");
      setCourseDesc("");
      setCourseLevel("");
      setShowCourseForm(false);
      router.refresh();
    } catch {
      setError(t("networkRetry"));
    } finally {
      setCreatingCourse(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          <FilterChip
            active={courseFilter === "all"}
            onClick={() => setCourseFilter("all")}
            label={t("allCourses", { n: catalog.courses.length }, "Mọi khóa ({n})")}
          />
          {catalog.courses.map((c) => (
            <FilterChip
              key={c.id}
              active={courseFilter === c.id}
              onClick={() => setCourseFilter(c.id)}
              label={c.title}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCourseForm((v) => !v)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t("addCourse", "Thêm khóa học")}
          </button>
          <button
            type="button"
            onClick={onResetSeed}
            disabled={resetting}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {resetting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("restoring")}
              </span>
            ) : (
              t("restoreSeed")
            )}
          </button>
          <Link
            href="/admin/learn/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            <Plus className="h-4 w-4" />
            {t("addLesson")}
          </Link>
        </div>
      </div>

      {showCourseForm ? (
        <form
          onSubmit={onCreateCourse}
          className="card-outline grid gap-3 p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-zinc-900">
              {t("addCourse", "Thêm khóa học")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="new-course-title">
              {t("courseTitle", "Tên khóa học")}
            </label>
            <input
              id="new-course-title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="new-course-id">
              {t("courseSlug", "Mã URL (tuỳ chọn)")}
            </label>
            <input
              id="new-course-id"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={inputClass}
              placeholder="ielts-foundation"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="new-course-level">
              {t("courseLevel", "Cấp độ (tuỳ chọn)")}
            </label>
            <input
              id="new-course-level"
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value)}
              className={inputClass}
              placeholder="A"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="new-course-desc">
              {t("courseDesc", "Mô tả")}
            </label>
            <input
              id="new-course-desc"
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={creatingCourse}
              className="inline-flex items-center gap-1.5 rounded-xl bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
            >
              {creatingCourse ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t("saveCourse", "Tạo khóa học")}
            </button>
            <button
              type="button"
              onClick={() => setShowCourseForm(false)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {tc("cancel")}
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={skillFilter === "all"}
          onClick={() => setSkillFilter("all")}
          label={t("allFilter", { n: counts.all })}
        />
        {LEARN_SKILLS.map((s) => (
          <FilterChip
            key={s}
            active={skillFilter === s}
            onClick={() => setSkillFilter(s)}
            label={t("skillFilter", { vi: ts(`vi.${s}`), n: counts[s] })}
          />
        ))}
      </div>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-700">{message}</p>
      ) : null}

      <div className="card-outline overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("colOrder")}</th>
              <th className="px-4 py-3 font-medium">{t("colCourse", "Khóa học")}</th>
              <th className="px-4 py-3 font-medium">{t("colSkill")}</th>
              <th className="px-4 py-3 font-medium">{t("colTitle")}</th>
              <th className="px-4 py-3 font-medium">{t("colExercises")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  {t("emptyFilter")}
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr
                  key={`${lesson.courseId}:${lesson.id}`}
                  className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50/80"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {lesson.order}
                  </td>
                  <td className="max-w-[10rem] px-4 py-3">
                    <span className="break-words text-xs font-medium text-zinc-700">
                      {lesson.courseTitle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-wewin-accent-blue-bg px-2 py-0.5 text-xs font-medium text-wewin-accent-blue">
                      {ts(lesson.skill)}
                    </span>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 sm:max-w-none">
                    <div className="break-words font-medium text-zinc-900">
                      {lesson.title}
                    </div>
                    <div className="mt-0.5 break-all font-mono text-[11px] text-zinc-400">
                      {lesson.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {t("exerciseCount", { n: lesson.exercises.length })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={learnLessonHref(
                          lesson.courseId,
                          lesson.skill,
                          lesson.id,
                        )}
                        className="text-xs font-medium text-zinc-500 hover:text-wewin-navy"
                        target="_blank"
                      >
                        {t("viewStudent")}
                      </Link>
                      <Link
                        href={`/admin/learn/${lesson.id}`}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                      >
                        {tc("edit")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(lesson)}
                        disabled={busyId === lesson.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        {busyId === lesson.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        {tc("delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-wewin-navy bg-wewin-navy text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}
