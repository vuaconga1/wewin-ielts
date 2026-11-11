"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, Award } from "lucide-react";
import type { WorksheetLesson } from "@/lib/learn/worksheet-types";
import { WorksheetSectionCard } from "./worksheet-section-card";

interface Props {
  lesson: WorksheetLesson;
}

export function WorksheetPlayer({ lesson }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sectionScores, setSectionScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [activeTab, setActiveTab] = useState<string>("all");

  const totalQuestions = lesson.sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredCount = Object.values(answers).filter((v) => v && v.trim().length > 0).length;

  const totalScore = Object.values(sectionScores).reduce((acc, s) => acc + s.correct, 0);
  const totalEvaluated = Object.values(sectionScores).reduce((acc, s) => acc + s.total, 0);

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSectionEvaluated = (sectionId: string, correct: number, total: number) => {
    setSectionScores((prev) => ({ ...prev, [sectionId]: { correct, total } }));
  };

  const visibleSections =
    activeTab === "all"
      ? lesson.sections
      : lesson.sections.filter((s) => s.sectionKey === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/learn/worksheets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-wewin-navy hover:text-wewin-accent-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Thư viện Worksheets
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-wewin-gold/15 text-[#7a5f12] border border-wewin-gold/30">
            Cấp độ {lesson.level}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-wewin-accent-blue-bg text-wewin-navy">
            Part {lesson.part}
          </span>
        </div>
      </div>

      {/* Header Card */}
      <div className="wewin-card-3d p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-wewin-accent-blue uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" /> {lesson.title}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-wewin-navy break-words">
              {lesson.subject}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {lesson.subjectVi} • Tổng cộng {lesson.sections.length} phần bài tập ({totalQuestions} câu hỏi)
            </p>
          </div>

          {/* Quick stats badge */}
          <div className="flex items-center gap-3 bg-wewin-accent-blue-bg/60 p-3 rounded-xl border border-wewin-accent-blue/15">
            <div className="text-right">
              <p className="text-xs text-zinc-500 font-medium">Đã điền</p>
              <p className="text-lg font-bold text-wewin-navy">
                {answeredCount} / {totalQuestions}
              </p>
            </div>
            {totalEvaluated > 0 && (
              <div className="pl-3 border-l border-wewin-border text-right">
                <p className="text-xs text-zinc-500 font-medium">Đã chấm</p>
                <p className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                  <Award className="w-4 h-4" /> {totalScore} / {totalEvaluated}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-wewin-border flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 mr-1">Chuyển phần:</span>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-wewin-navy text-white shadow-xs"
                : "bg-wewin-accent-blue-bg hover:bg-wewin-accent-blue/15 text-wewin-navy"
            }`}
          >
            Tất cả ({lesson.sections.length})
          </button>
          {lesson.sections.map((s) => {
            const secScore = sectionScores[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.sectionKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === s.sectionKey
                    ? "bg-wewin-navy text-white shadow-xs"
                    : "bg-wewin-accent-blue-bg hover:bg-wewin-accent-blue/15 text-wewin-navy"
                }`}
              >
                <span>Phần {s.sectionKey}</span>
                {secScore && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Sections */}
      <div>
        {visibleSections.map((section) => (
          <WorksheetSectionCard
            key={section.id}
            section={section}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSectionEvaluated={(correct, total) => handleSectionEvaluated(section.id, correct, total)}
          />
        ))}
      </div>

      {/* Completion congratulations banner if all evaluated */}
      {totalEvaluated >= totalQuestions && totalQuestions > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover border border-wewin-gold/30 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-wewin-gold/20 flex shrink-0 items-center justify-center">
              <CheckCircle className="w-7 h-7 text-wewin-gold" />
            </div>
            <div>
              <h4 className="text-xl font-bold">Chúc mừng bạn đã hoàn thành bài tập!</h4>
              <p className="text-zinc-200 text-sm mt-0.5">
                Bạn đạt được {totalScore} / {totalQuestions} câu chính xác (
                {Math.round((totalScore / totalQuestions) * 100)}%).
              </p>
            </div>
          </div>
          <Link
            href="/learn/worksheets"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-colors text-center"
          >
            Làm bài tiếp theo
          </Link>
        </div>
      )}
    </div>
  );
}

