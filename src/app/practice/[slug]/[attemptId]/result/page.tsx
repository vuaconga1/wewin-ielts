import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AiScorePanel } from "@/components/practice/ai-score-panel";
import { ScoredResultReview } from "@/components/practice/scored-result-review";
import { getSessionUser } from "@/lib/auth";
import { canAccessAttempt } from "@/lib/practice/attempt-access";
import {
  practiceAttemptPath,
  practiceResultPath,
} from "@/lib/practice/paths";
import {
  buildSpeakingExamQueue,
  filterSpeakingExamQueue,
  parseSpeakingAnswerMark,
  parseSpeakingPartKinds,
  partsForSpeakingAttempt,
  type SpeakingExamItem,
} from "@/lib/practice/speaking-exam";
import { countWords, estimateBand, gradeAnswers } from "@/lib/scoring";
import { getAttempt, getTestBySlug } from "@/lib/store/test-store";
import { getTranslations } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; attemptId: string }> };

type SampleSource = {
  correctAnswer?: unknown;
  explanation?: string;
  content?: { stem?: string };
};

function sampleOf(q: SampleSource): string | null {
  if (typeof q.explanation === "string" && q.explanation.trim()) {
    return q.explanation;
  }
  if (typeof q.correctAnswer === "string" && q.correctAnswer.trim()) {
    return q.correctAnswer;
  }
  return null;
}

function sampleForSpeakingItem(
  item: SpeakingExamItem,
  parts: {
    questions: SampleSource[];
  }[],
): string | null {
  const part = parts[item.packIndex];
  if (!part) return null;
  const stemNorm = item.stem.trim().toLowerCase();
  if (!stemNorm) return null;
  const byStem = part.questions.find(
    (q) => (q.content?.stem ?? "").trim().toLowerCase() === stemNorm,
  );
  return byStem ? sampleOf(byStem) : null;
}

function formatSpeakingSubmission(
  raw: string,
  t: Translator,
): { empty: boolean; text: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { empty: true, text: t("empty", "(trống)") };
  }
  const mark = parseSpeakingAnswerMark(trimmed);
  if (mark) {
    if (mark.durationSec != null) {
      return {
        empty: false,
        text: t(
          "recordedWithDuration",
          { n: mark.durationSec },
          "Đã ghi âm ({n} giây)",
        ),
      };
    }
    return { empty: false, text: t("recorded", "Đã ghi âm") };
  }
  // Never dump JSON-looking blobs to the user
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return { empty: false, text: t("recorded", "Đã ghi âm") };
  }
  return { empty: false, text: trimmed };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) return { title: "Result | Wewin IELTS" };
  const test = await getTestBySlug(attempt.testSlug);
  return {
    title: test
      ? `${test.title} | Wewin IELTS`
      : "Result | Wewin IELTS",
  };
}

export default async function PracticeResultPage({ params }: Props) {
  const { slug, attemptId } = await params;
  const { t } = await getTranslations("result");
  const { t: tCommon } = await getTranslations("common");
  const brand = tCommon("brand", "WEWIN Education");
  const attempt = await getAttempt(attemptId);
  if (!attempt) notFound();

  if (slug !== attempt.testSlug) {
    redirect(practiceResultPath(attempt.testSlug, attemptId));
  }

  const user = await getSessionUser();
  if (!canAccessAttempt(attempt, user)) {
    if (!user) {
      redirect(
        `/login?next=${encodeURIComponent(practiceResultPath(slug, attemptId))}`,
      );
    }
    redirect("/forbidden");
  }

  // Keys are only revealed after submit — unfinished attempts stay on practice.
  if (!attempt.finishedAt) {
    redirect(practiceAttemptPath(slug, attemptId));
  }

  const test = await getTestBySlug(attempt.testSlug);
  if (!test) notFound();

  const filterSet =
    attempt.questionNumbers && attempt.questionNumbers.length > 0
      ? new Set(attempt.questionNumbers)
      : null;

  const sectionParts =
    test.skill === "SPEAKING"
      ? partsForSpeakingAttempt(test.parts, attempt)
      : test.parts.filter((p) => attempt.sectionOrders.includes(p.order));

  const selectedParts = sectionParts
    .map((part) => ({
      ...part,
      questions: part.questions.filter((q) =>
        filterSet ? filterSet.has(q.number) : true,
      ),
    }))
    .filter((part) => part.questions.length > 0);

  const questions = selectedParts.flatMap((part) =>
    part.questions.map((q) => ({
      number: q.number,
      type: q.type,
      content: q.content,
      correctAnswer: q.correctAnswer,
      acceptableAnswers: q.acceptableAnswers,
      explanation: q.explanation,
      sectionTitle: part.title,
      sectionOrder: part.order,
    })),
  );

  /** Same queue / renumbering as the Speaking practice session (answers key 1..N). */
  const speakingQueue =
    test.skill === "SPEAKING"
      ? filterSpeakingExamQueue(
          buildSpeakingExamQueue(sectionParts),
          parseSpeakingPartKinds(attempt.speakingPartKinds),
        ).filter((it) => (filterSet ? filterSet.has(it.number) : true))
      : [];

  const grade = gradeAnswers(questions, attempt.answers);
  const band = estimateBand(grade.correct, grade.total);
  const isSpeaking = test.skill === "SPEAKING";
  const isProdSkill = test.skill === "WRITING" || isSpeaking;
  const isRetryWrong = Boolean(filterSet);

  return (
    <div className="min-h-screen overflow-x-hidden bg-wewin-bg">
      <header className="border-b border-black/20 bg-wewin-navy text-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label={brand}
            >
              <Image
                src="/brand/wewin-logo.png"
                alt={brand}
                width={168}
                height={44}
                sizes="(max-width: 640px) 96px, 128px"
                className="h-7 w-auto max-w-[min(128px,32vw)] object-contain object-left sm:h-8"
                priority
              />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">{t("title")}</h1>
              <p className="break-words text-sm text-zinc-300">
                {test.title}
                {isRetryWrong ? (
                  <span className="ml-2 text-xs font-medium text-wewin-gold">
                    {t("retryWrongSuffix")}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm sm:justify-end">
            <Link
              href={`/tests/${test.slug}`}
              className="font-medium text-white hover:underline"
            >
              {t("retry")}
            </Link>
            <Link
              href="/account/attempts"
              className="text-zinc-300 hover:text-white hover:underline"
            >
              {t("history")}
            </Link>
            <Link
              href="/tests"
              className="text-zinc-300 hover:text-white hover:underline"
            >
              {t("catalog")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl min-w-0 space-y-8 px-4 py-8">
        {isProdSkill ? (
          <AiScorePanel
            attemptId={attemptId}
            skill={isSpeaking ? "SPEAKING" : "WRITING"}
            initial={attempt.aiScore ?? null}
          />
        ) : (
          <section className="grid gap-4 rounded-xl border border-wewin-border bg-white p-6 sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">{t("rawScore")}</p>
              <p className="text-3xl font-bold text-zinc-900">
                {grade.correct}/{grade.total}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">{t("accuracy")}</p>
              <p className="text-3xl font-bold text-wewin-navy">{grade.percent}%</p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">{t("band")}</p>
              <p className="text-3xl font-bold text-emerald-600">{band}</p>
            </div>
          </section>
        )}

        {isSpeaking ? (
          <section className="space-y-6">
            {speakingQueue.map((item) => {
              const raw = attempt.answers[String(item.number)] ?? "";
              const submission = formatSpeakingSubmission(raw, t);
              const sample = sampleForSpeakingItem(item, sectionParts);
              const partLabel = t(
                `speakingPart${item.partKind}`,
                `Part ${item.partKind}`,
              );
              const stem = item.stem.trim();

              return (
                <article
                  key={`speaking-${item.packIndex}-${item.number}`}
                  className="overflow-hidden rounded-xl border border-wewin-border bg-white shadow-sm"
                >
                  <header className="border-b border-wewin-border bg-white px-4 py-3.5 sm:px-5">
                    <h2 className="text-base font-semibold text-wewin-navy sm:text-lg">
                      {partLabel}
                      <span className="ml-2 font-normal text-zinc-400">
                        · Q{item.number}
                      </span>
                    </h2>
                    {item.topic ? (
                      <p className="mt-1 break-words text-sm text-zinc-500">
                        {item.topic}
                      </p>
                    ) : null}
                  </header>

                  <div className="space-y-5 p-4 sm:space-y-6 sm:p-5">
                    <div className="rounded-lg border border-wewin-navy/10 border-l-[3px] border-l-wewin-navy bg-wewin-bg px-3.5 py-3.5 sm:px-4">
                      <p className="mb-2 text-sm font-semibold text-wewin-navy">
                        {t("prompt")}
                      </p>
                      <div className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                        {stem || t("noPrompt", "(không có đề)")}
                      </div>
                    </div>

                    <div className="rounded-lg border border-wewin-navy/20 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4">
                      <p className="mb-3 text-sm font-semibold text-wewin-navy">
                        {t("submission")}
                      </p>
                      <div
                        className={`break-words whitespace-pre-wrap text-sm leading-relaxed ${
                          submission.empty
                            ? "italic text-zinc-400"
                            : "text-zinc-800"
                        }`}
                      >
                        {submission.text}
                      </div>
                    </div>

                    {sample ? (
                      <div className="rounded-lg border border-dashed border-wewin-navy/35 bg-wewin-accent-blue-bg/50 px-3.5 py-3.5 sm:px-4">
                        <p className="mb-2 text-sm font-semibold text-wewin-navy">
                          {t("sample")}
                        </p>
                        <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                          {sample}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        ) : isProdSkill ? (
          <section className="space-y-6">
            {questions.map((q) => {
              const user = attempt.answers[String(q.number)] ?? "";
              const sample = sampleOf(q);
              const words = countWords(user);
              const minWords =
                typeof (q.content as { minWords?: number }).minWords === "number"
                  ? (q.content as { minWords: number }).minWords
                  : q.type === "ESSAY"
                    ? q.number === 1
                      ? 150
                      : 250
                    : 0;
              const isEssay = q.type === "ESSAY";
              const meetsMin = !minWords || words >= minWords;
              const stem = String((q.content as { stem?: string }).stem ?? "");
              const empty = !user.trim();

              return (
                <article
                  key={`${q.sectionOrder}-${q.number}`}
                  className="overflow-hidden rounded-xl border border-wewin-border bg-white shadow-sm"
                >
                  <header className="border-b border-wewin-border bg-white px-4 py-3.5 sm:px-5">
                    <h2 className="text-base font-semibold text-wewin-navy sm:text-lg">
                      {q.sectionTitle}
                      <span className="ml-2 font-normal text-zinc-400">
                        · Q{q.number}
                      </span>
                    </h2>
                  </header>

                  <div className="space-y-5 p-4 sm:space-y-6 sm:p-5">
                    <div className="rounded-lg border border-wewin-navy/10 border-l-[3px] border-l-wewin-navy bg-wewin-bg px-3.5 py-3.5 sm:px-4">
                      <p className="mb-2 text-sm font-semibold text-wewin-navy">
                        {t("prompt")}
                      </p>
                      <div className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                        {stem || t("noPrompt")}
                      </div>
                    </div>

                    <div className="rounded-lg border border-wewin-navy/20 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-wewin-navy">
                          {t("submission")}
                        </p>
                        {isEssay ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
                              empty
                                ? "bg-zinc-100 text-zinc-500"
                                : meetsMin
                                  ? "bg-wewin-accent-blue-bg text-wewin-navy"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {meetsMin && !empty
                              ? t("wordsOk", { n: words, min: minWords })
                              : t("wordsShort", { n: words, min: minWords })}
                          </span>
                        ) : null}
                      </div>
                      <div
                        className={`break-words whitespace-pre-wrap text-sm leading-relaxed ${
                          empty ? "italic text-zinc-400" : "text-zinc-800"
                        }`}
                      >
                        {empty ? t("empty") : user}
                      </div>
                    </div>

                    {sample ? (
                      <div className="rounded-lg border border-dashed border-wewin-navy/35 bg-wewin-accent-blue-bg/50 px-3.5 py-3.5 sm:px-4">
                        <p className="mb-2 text-sm font-semibold text-wewin-navy">
                          {t("sample")}
                        </p>
                        <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                          {sample}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <ScoredResultReview
            testTitle={test.title}
            testSlug={test.slug}
            sectionOrders={attempt.sectionOrders}
            items={grade.items}
            correct={grade.correct}
            wrong={grade.wrong}
            skipped={grade.skipped}
          />
        )}
      </main>
    </div>
  );
}
