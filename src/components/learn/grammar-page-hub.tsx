"use client";

import React, { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Layers, CheckCircle2, FileSpreadsheet } from "lucide-react";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { WorksheetCardCatalogItem } from "@/lib/learn/worksheet-types";
import { TopicCatalog } from "@/components/learn/topic-catalog";
import { WorksheetCardsGrid } from "@/components/learn/worksheets/worksheet-cards-grid";
import { learnCatalogHref, learnVocabGrammarHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

interface Props {
  trackLabel: string;
  parent?: "vocab-grammar" | "catalog";
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
  lockedPanel?: ReactNode;
  cards: WorksheetCardCatalogItem[];
  isStaff?: boolean;
  initialTab?: "grammar" | "exercises";
}

export function GrammarPageHub({
  trackLabel,
  parent = "vocab-grammar",
  topics,
  progress,
  lockedPanel,
  cards,
  isStaff = false,
  initialTab = "grammar",
}: Props) {
  const { t } = useTranslations("learn");
  const [activeTab, setActiveTab] = useState<"grammar" | "exercises">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: "grammar" | "exercises") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const totalQuestions = cards.reduce((acc, c) => acc + c.questionCount, 0);
  const totalSections = cards.reduce((acc, c) => acc + c.sectionCount, 0);

  const underCatalog = parent === "catalog";

  const tabsControl = (
    <div className="flex items-center gap-2 sm:gap-3 border-b border-zinc-200 pb-3 mb-6">
      <button
        type="button"
        onClick={() => handleTabChange("grammar")}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
          activeTab === "grammar"
            ? "bg-wewin-navy text-white shadow-md shadow-wewin-navy/20"
            : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-wewin-navy border border-zinc-200"
        }`}
      >
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>Ngữ pháp</span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            activeTab === "grammar"
              ? "bg-white/20 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {topics.length} bài
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleTabChange("exercises")}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
          activeTab === "exercises"
            ? "bg-wewin-navy text-white shadow-md shadow-wewin-navy/20"
            : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-wewin-navy border border-zinc-200"
        }`}
      >
        <Layers className="w-4 h-4 shrink-0" />
        <span>Bài tập ngữ pháp</span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            activeTab === "exercises"
              ? "bg-white/20 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {cards.length} thẻ chuyên đề
        </span>
      </button>
    </div>
  );

  if (activeTab === "grammar") {
    return (
      <TopicCatalog
        track="grammar"
        trackLabel={trackLabel}
        parent={parent}
        topics={topics}
        progress={progress}
        lockedPanel={lockedPanel}
        toolbar={tabsControl}
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={underCatalog ? learnCatalogHref() : learnVocabGrammarHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {underCatalog
            ? t("backCatalog", "← Tất cả khóa học")
            : t("backVocabGrammar", "← Từ vựng và ngữ pháp")}
        </Link>
        <nav className="mt-2 text-xs text-zinc-500 sm:text-sm">
          <Link href={learnCatalogHref()} className="hover:text-wewin-navy hover:underline">
            {t("catalogTitle", "Chọn khóa học")}
          </Link>
          <span className="mx-1.5">›</span>
          {underCatalog ? null : (
            <>
              <Link
                href={learnVocabGrammarHref()}
                className="hover:text-wewin-navy hover:underline"
              >
                {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
              </Link>
              <span className="mx-1.5">›</span>
            </>
          )}
          <span className="font-medium text-zinc-800">{trackLabel}</span>
        </nav>
        <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {trackLabel}
        </h1>
      </header>

      {tabsControl}

      {/* Cards Grid */}
      <WorksheetCardsGrid cards={cards} isStaff={isStaff} />
    </div>
  );
}

