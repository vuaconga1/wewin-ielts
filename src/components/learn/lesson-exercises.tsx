"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import type { LearnSkill } from "@/lib/learn/types";
import type { PublicLearnExercise } from "@/lib/learn/public-lesson";
import { learnLessonHref, learnSkillHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type Props = {
  courseId: string;
  lessonId: string;
  skill: LearnSkill;
  exercises: PublicLearnExercise[];
  videoCompleted: boolean;
  alreadyPassed: boolean;
  unlockedNextId: string | null;
  /** Override next-lesson link (e.g. vocab/grammar topics). */
  nextLessonHref?: string;
  /** Override back-to-catalog link when no next lesson. */
  catalogHref?: string;
  catalogLabel?: string;
};

export function LessonExercises({
  courseId,
  lessonId,
  skill,
  exercises,
  videoCompleted,
  alreadyPassed,
  unlockedNextId: initialNext,
  nextLessonHref,
  catalogHref,
  catalogLabel,
}: Props) {
  const { t } = useTranslations("learn");
  const { t: tSkills } = useTranslations("skills");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [passed, setPassed] = useState(alreadyPassed);
  const [feedback, setFeedback] = useState<{
    correct: number;
    total: number;
    results: Record<string, boolean>;
    message: string;
  } | null>(
    alreadyPassed
      ? {
          correct: exercises.length,
          total: exercises.length,
          results: Object.fromEntries(exercises.map((e) => [e.id, true])),
          message: t("alreadyDone"),
        }
      : null,
  );
  const [nextId, setNextId] = useState(initialNext);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoCompleted) {
      setError(t("watchFirst"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exercises",
          lessonId,
          answers,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        passed?: boolean;
        correct?: number;
        total?: number;
        results?: Record<string, boolean>;
        unlockedNextId?: string | null;
      };
      if (!res.ok) {
        setError(data.error ?? t("submitFailed"));
        return;
      }
      const correct = data.correct ?? 0;
      const total = data.total ?? exercises.length;
      setFeedback({
        correct,
        total,
        results: data.results ?? {},
        message: data.passed
          ? t("excellent")
          : t("notPassed", { correct, total }),
      });
      if (data.passed) {
        setPassed(true);
        setNextId(data.unlockedNextId ?? null);
        router.refresh();
      }
    } catch {
      setError(t("networkRetry"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!videoCompleted && !passed) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-zinc-400" />
        <h3 className="mt-3 text-base font-semibold text-zinc-800">
          {t("exercisesLocked")}
        </h3>
        <p className="mt-1 text-sm text-zinc-600">{t("exercisesLockedDesc")}</p>
      </div>
    );
  }

  return (
    <section className="card-outline p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">{t("reinforce")}</h2>
          <p className="mt-1 text-sm text-zinc-600">{t("needAllCorrect")}</p>
        </div>
        {passed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("passed")}
          </span>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        {exercises.map((ex, i) => (
          <fieldset key={ex.id} className="space-y-2">
            <legend className="text-sm font-semibold text-zinc-900">
              {t("questionN", { n: i + 1 })} {ex.prompt}
            </legend>
            {ex.type === "multiple_choice" && ex.options ? (
              <div className="space-y-2">
                {ex.options.map((opt) => {
                  const letter = opt.trim().charAt(0);
                  const selected = answers[ex.id] === letter || answers[ex.id] === opt;
                  const marked = feedback?.results[ex.id];
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                        selected
                          ? "border-wewin-accent-blue bg-wewin-accent-blue-bg"
                          : "border-zinc-200 hover:border-zinc-300"
                      } ${
                        marked === false && selected
                          ? "border-rose-300 bg-rose-50"
                          : ""
                      } ${
                        marked === true && selected
                          ? "border-emerald-300 bg-emerald-50"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={ex.id}
                        value={letter}
                        checked={answers[ex.id] === letter}
                        disabled={passed}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [ex.id]: letter }))
                        }
                        className="mt-0.5"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={answers[ex.id] ?? ""}
                disabled={passed}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))
                }
                placeholder={t("answerPlaceholder")}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg ${
                  feedback?.results[ex.id] === false
                    ? "border-rose-300"
                    : feedback?.results[ex.id] === true
                      ? "border-emerald-300"
                      : "border-zinc-200"
                }`}
              />
            )}
          </fieldset>
        ))}

        {error ? (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
        {feedback ? (
          <p
            className={`text-sm ${passed ? "text-emerald-700" : "text-amber-800"}`}
          >
            {feedback.message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {!passed ? (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t("submitExercises")}
            </button>
          ) : null}
          {passed && nextId ? (
            <Link
              href={
                nextLessonHref ?? learnLessonHref(courseId, skill, nextId)
              }
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("nextLesson")}
            </Link>
          ) : null}
          {passed && !nextId ? (
            <Link
              href={catalogHref ?? learnSkillHref(courseId, skill)}
              className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              {catalogLabel
                ? t("viewTopicCatalog", { track: catalogLabel }, "Xem lại {track}")
                : t("viewCurriculum", { skill: tSkills(skill) })}
            </Link>
          ) : null}
        </div>
      </form>
    </section>
  );
}
