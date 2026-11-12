"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Filter,
  BookOpen,
  PenLine,
} from "lucide-react";
import type { WorksheetCardCatalogItem } from "@/lib/learn/worksheet-types";

interface Props {
  cards: WorksheetCardCatalogItem[];
  isStaff?: boolean;
}

const CATEGORIES = [
  { key: "all", label: "Tất cả chuyên đề" },
  { key: "tenses_verbs", label: "Hệ thống Thì & Động từ" },
  { key: "sentence_structures", label: "Cấu trúc Biến đổi câu" },
  { key: "parts_of_speech", label: "Từ loại & Cấu trúc bổ trợ" },
] as const;

function getCardIcon(category: string, index: number) {
  if (category === "tenses_verbs") return PenLine;
  if (category === "sentence_structures") return Layers;
  if (category === "parts_of_speech") return BookOpen;
  return [BookOpen, PenLine, Layers][index % 3]!;
}

export function WorksheetCardsGrid({ cards, isStaff: _isStaff }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchCat =
        selectedCategory === "all" || card.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.subject.toLowerCase().includes(q) ||
        card.subjectVi.toLowerCase().includes(q) ||
        card.sourceWorksheets.some((ws) => ws.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [cards, selectedCategory, searchQuery]);

  return (
    <div>
      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count =
              cat.key === "all"
                ? cards.length
                : cards.filter((c) => c.category === cat.key).length;
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-wewin-navy text-white shadow-xs"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-wewin-navy border border-zinc-200"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo chủ đề, từ khóa..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-wewin-navy/20 focus:border-wewin-navy text-zinc-800 placeholder-zinc-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Cards matching Image 2 layout & unified navy color */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 shadow-xs">
          <Filter className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-600 font-semibold text-sm">
            Không tìm thấy thẻ bài tập nào phù hợp.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="mt-3 text-xs font-bold text-wewin-accent-blue hover:underline cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
          {filteredCards.map((card, index) => {
            const Icon = getCardIcon(card.category, index);
            return (
              <Link
                key={card.id}
                href={`/learn/vocab-grammar/grammar/${card.slug}`}
                className="card-outline-hover group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all hover:border-blue-400/60 bg-white"
              >
                {/* Header matching Image 2 (Unified Dark Navy) */}
                <div className="flex items-start gap-3 px-3.5 py-3 text-white sm:px-4 sm:py-3.5 bg-gradient-to-r from-slate-700 to-[#1a2b55]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-sm font-bold leading-snug text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.2)] sm:text-base">
                      {card.subjectVi}
                    </h2>
                  </div>
                </div>

                {/* Body matching Image 2 */}
                <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4 bg-gradient-to-b from-blue-50/70 to-white">
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {card.subject || card.title.replace(/^THẺ BÀI TẬP\s*\d*\s*[-–—:]?\s*/i, "")}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-xs font-medium text-slate-600 truncate">
                      {card.sectionCount} phần ({card.questionCount} câu) · {card.level}
                    </span>

                    <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-wewin-navy group-hover:text-white group-hover:border-wewin-navy">
                      Học
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
