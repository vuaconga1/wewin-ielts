"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  List,
  Lock,
  PlayCircle,
} from "lucide-react";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { GrammarCourse, VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import { learnVocabGrammarTopicHref, learnVocabGrammarTrackHref, learnVocabTopicLearnHref } from "@/lib/learn/hrefs";
import { pickLocalized } from "@/lib/learn/vocab-grammar-types";
import { useTranslations } from "@/i18n/provider";

type Props = {
  track: VocabGrammarTrack;
  course?: GrammarCourse;
  moduleTitle: string;
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
  currentSlug: string;
  currentTitle: string;
  nextTopic?: { slug: string; title: string } | null;
};

export function TopicSidebar({
  track,
  course,
  moduleTitle,
  topics,
  progress,
  currentSlug,
  currentTitle,
  nextTopic,
}: Props) {
  const { t, locale } = useTranslations("learn");
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentIndex = topics.findIndex((tpc) => tpc.slug === currentSlug);

  const topicHref = (slug: string) =>
    track === "vocabulary"
      ? learnVocabTopicLearnHref(slug)
      : learnVocabGrammarTopicHref(track, slug);

  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (activeItemRef.current && (mobileOpen || typeof window !== "undefined" && window.innerWidth >= 1024)) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [currentSlug, mobileOpen]);

  return (
    <aside className="min-w-0 h-full flex flex-col min-h-0">
      {/* Header bar: on mobile acts as a toggle button */}
      <div className="bg-wewin-navy px-3.5 py-2.5 sm:px-4 sm:py-3 text-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex items-center gap-2 min-w-0 text-left lg:cursor-default"
            aria-expanded={mobileOpen}
          >
            <List className="h-4 w-4 shrink-0 opacity-90 text-wewin-gold" />
            <div className="min-w-0">
              <p className="truncate text-xs sm:text-sm font-bold leading-snug">
                {moduleTitle}
              </p>
              <p className="truncate text-[11px] text-blue-200 lg:hidden">
                {currentIndex >= 0
                  ? `Bài ${currentIndex + 1}/${topics.length}: ${currentTitle}`
                  : currentTitle}
              </p>
            </div>
          </button>

          {/* Toggle button on mobile & small viewports */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 px-2.5 py-1 text-xs font-semibold text-white shrink-0 transition"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("collapseLessons", "Thu gọn danh sách bài học") : t("expandLessons", "Mở rộng danh sách bài học")}
          >
            <span>{mobileOpen ? t("collapse", "Thu gọn") : t("lessonList", "Danh sách bài")}</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-mono leading-none">
              {topics.length}
            </span>
            {mobileOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible content on mobile, regular visible column on desktop */}
      <div
        className={`${
          mobileOpen
            ? "flex flex-col max-h-[60vh] border-b border-zinc-200 shadow-lg"
            : "hidden"
        } lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:max-h-none lg:border-b-0 lg:shadow-none min-h-0 bg-white`}
      >
        <div className="border-b border-zinc-200 bg-wewin-accent-blue-bg/40 px-4 py-2 shrink-0">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="break-words text-xs font-semibold text-wewin-navy">
              {topics.find((tpc) => tpc.slug === currentSlug)?.slidesUrl
                ? t("slidesLesson", "Slide bài giảng")
                : t("videoLecture", "Video bài giảng")}
              : {currentTitle}
            </p>
          </div>
        </div>

        <div className="border-b border-zinc-200 px-4 py-2 shrink-0">
          <Link
            href={learnVocabGrammarTrackHref(track, course)}
            className="text-xs font-medium text-wewin-navy hover:underline flex items-center gap-1"
          >
            {t("backTrack", "← Quay lại chương học")}
          </Link>
        </div>

        {nextTopic ? (
          <div className="border-b border-zinc-200 px-4 py-2 shrink-0 bg-zinc-50/70">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {t("nextLessonLabel", "Bài học tiếp theo:")}
            </p>
            <Link
              href={topicHref(nextTopic.slug)}
              onClick={() => setMobileOpen(false)}
              className="mt-0.5 block break-words text-xs font-semibold text-wewin-navy hover:underline line-clamp-1"
            >
              {nextTopic.title}
            </Link>
          </div>
        ) : null}

        <ol className="flex-1 min-h-0 space-y-0.5 overflow-y-auto p-2 scroll-smooth">
          {topics.map((topic, i) => {
            const unlocked = isTopicUnlocked(topic, topics, progress);
            const done = Boolean(progress.lessons[topic.id]?.exercisePassed);
            const active = topic.slug === currentSlug;
            const videoDone = Boolean(progress.lessons[topic.id]?.videoCompleted);

            const inner = (
              <>
                <span className="mt-0.5 shrink-0">
                  {!unlocked ? (
                    <Lock className="h-4 w-4 text-zinc-400" />
                  ) : done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : active ? (
                    <PlayCircle className="h-4 w-4 text-wewin-navy" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-300" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium leading-snug">
                    {i + 1}. {pickLocalized(topic.title, locale)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">
                    {!unlocked
                      ? t("locked")
                      : done
                        ? t("done")
                        : topic.slidesUrl
                          ? t("viewSlides", "Xem slide")
                          : videoDone
                          ? t("doExercises")
                          : t("watchVideo")}
                  </span>
                </span>
              </>
            );

            if (!unlocked) {
              return (
                <li key={topic.id} ref={active ? activeItemRef : undefined}>
                  <div className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-zinc-400">
                    {inner}
                  </div>
                </li>
              );
            }

            return (
              <li key={topic.id} ref={active ? activeItemRef : undefined}>
                <Link
                  href={topicHref(topic.slug)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition ${
                    active
                      ? "bg-wewin-accent-blue-bg text-wewin-navy font-medium shadow-xs"
                      : "text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  {inner}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
