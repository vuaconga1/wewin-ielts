"use client";

import Link from "next/link";
import { TestStartPanel } from "@/components/practice/test-start-panel";
import {
  TestAttemptHistory,
  type TestAttemptHistoryItem,
} from "@/components/tests/test-attempt-history";
import { useTranslations } from "@/i18n/provider";
import {
  buildSpeakingExamQueue,
  countSpeakingItemsByPart,
} from "@/lib/practice/speaking-exam";

type Part = {
  title: string;
  order: number;
  content?: string;
  questions: {
    number: number;
    type?: string;
    content?: {
      stem?: string;
      speakingPart?: 1 | 2 | 3;
      topic?: string;
    };
  }[];
};

type Props = {
  slug: string;
  title: string;
  skill: string;
  examType?: string;
  backHref?: string;
  tags: string[];
  timeLimitMinutes: number | null;
  parts: Part[];
  qCount: number;
  description?: string;
  isLoggedIn: boolean;
  attempts: TestAttemptHistoryItem[];
};

export function TestDetailView({
  slug,
  title,
  skill,
  examType,
  backHref = "/tests",
  tags,
  timeLimitMinutes,
  parts,
  qCount,
  description,
  isLoggedIn,
  attempts,
}: Props) {
  const { t } = useTranslations();
  const examLabel =
    examType === "GENERAL"
      ? t("examTypes.GENERAL", "General")
      : examType === "ACADEMIC"
        ? t("examTypes.ACADEMIC", "Academic")
        : null;

  const speakingQueue =
    skill === "SPEAKING" ? buildSpeakingExamQueue(parts) : [];
  const speakingCounts =
    speakingQueue.length > 0
      ? countSpeakingItemsByPart(speakingQueue)
      : undefined;
  const speakingQCount = speakingQueue.length;
  const displayQCount = speakingQCount > 0 ? speakingQCount : qCount;
  const displayParts =
    skill === "SPEAKING" && speakingQCount > 0 ? 3 : parts.length;

  return (
    <div className="min-w-0">
      <Link
        href={backHref}
        className="mb-4 inline-block text-sm font-medium text-wewin-navy hover:underline"
      >
        {t("tests.backList")}
      </Link>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section data-tour="test-detail-info" className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {examLabel ? (
              <span className="rounded border border-wewin-navy/20 bg-wewin-accent-blue-bg px-2 py-0.5 text-xs font-semibold text-wewin-navy">
                {examLabel}
              </span>
            ) : null}
            {(tags.length ? tags : [t(`skills.${skill}`, skill)]).map((tag) => (
              <span key={tag} className="break-words text-sm text-wewin-navy">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="break-words text-xl font-bold text-zinc-900 sm:text-2xl">
            {title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600">
            <span>
              {timeLimitMinutes != null
                ? t("common.minutes", { n: timeLimitMinutes })
                : t("common.dash")}
            </span>
            <span>
              {t("common.partsQuestions", {
                parts: displayParts,
                questions: displayQCount,
              })}
            </span>
          </div>

          <div className="wewin-card-3d mt-6 overflow-hidden">
            <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-medium text-wewin-navy">
                {t("tests.tabInfo")}
              </h2>
            </div>

            <div className="min-w-0 space-y-4 p-4 sm:p-5">
              <div className="text-sm text-zinc-700">
                {description ? (
                  <p className="break-words whitespace-pre-wrap">{description}</p>
                ) : (
                  <p>
                    {t("tests.defaultDesc", {
                      skill: skill.toLowerCase(),
                      parts: displayParts,
                    })}
                    {skill === "WRITING"
                      ? t("tests.writingHint")
                      : skill === "SPEAKING"
                        ? t("tests.speakingHint")
                        : ""}
                  </p>
                )}
              </div>

              <div data-tour="test-detail-history">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("tests.historyTitle", "Lịch sử làm bài")}
                </h3>
                <TestAttemptHistory
                  slug={slug}
                  skill={skill}
                  isLoggedIn={isLoggedIn}
                  parts={parts.map((p) => ({ title: p.title, order: p.order }))}
                  attempts={attempts}
                />
              </div>
            </div>
          </div>
        </section>

        <aside data-tour="test-detail-start" className="min-w-0">
          <TestStartPanel
            slug={slug}
            skill={skill}
            speakingCounts={speakingCounts}
            parts={parts.map((p) => ({
              title: p.title,
              order: p.order,
              questions: p.questions.map((q) => ({ number: q.number })),
            }))}
            defaultTimeLimit={timeLimitMinutes}
          />
        </aside>
      </div>
    </div>
  );
}
