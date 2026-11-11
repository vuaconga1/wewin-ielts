"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { WorksheetSection } from "@/lib/learn/worksheet-types";
import { WorksheetQuestionRow } from "./worksheet-question-row";
import { checkAnswer } from "@/lib/learn/worksheet-grader";

interface Props {
  section: WorksheetSection;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, val: string) => void;
  onSectionEvaluated?: (score: number, total: number) => void;
}

export function WorksheetSectionCard({
  section,
  answers,
  onAnswerChange,
  onSectionEvaluated,
}: Props) {
  const [evaluation, setEvaluation] = useState<{
    results: Record<string, boolean>;
    score: number;
    total: number;
  } | null>(null);

  const handleCheck = () => {
    const results: Record<string, boolean> = {};
    let score = 0;

    for (const q of section.questions) {
      const userVal = answers[q.id] || "";
      const res = checkAnswer(userVal, q.acceptedAnswers);
      results[q.id] = res.isCorrect;
      if (res.isCorrect) score += 1;
    }

    const evalData = {
      results,
      score,
      total: section.questions.length,
    };
    setEvaluation(evalData);
    if (onSectionEvaluated) {
      onSectionEvaluated(score, section.questions.length);
    }
  };

  const handleReset = () => {
    setEvaluation(null);
    for (const q of section.questions) {
      onAnswerChange(q.id, "");
    }
  };

  return (
    <div className="panel overflow-hidden mb-8">
      {/* Section Header */}
      <div className="bg-wewin-accent-blue-bg/60 px-5 py-3.5 border-b border-wewin-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-wewin-navy text-wewin-gold-soft shrink-0 font-bold flex items-center justify-center text-sm shadow-xs">
            {section.sectionKey}
          </span>
          <h3 className="font-semibold text-wewin-navy text-base break-words">
            {section.instruction}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {evaluation && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                evaluation.score === evaluation.total
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-wewin-accent-blue-bg text-wewin-navy"
              }`}
            >
              {evaluation.score} / {evaluation.total} đúng
            </span>
          )}
          <span className="text-xs text-zinc-500 font-medium">
            {section.questions.length} câu hỏi
          </span>
        </div>
      </div>

      {/* Word bank / Context if available */}
      {section.wordBank && section.wordBank.length > 0 && (
        <div className="p-4 bg-wewin-gold/10 border-b border-wewin-gold/25">
          <p className="text-xs font-semibold text-[#7a5f12] uppercase tracking-wider mb-2">
            Từ vựng gợi ý (Word Bank):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {section.wordBank.map((w, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs font-medium bg-white rounded border border-wewin-gold/40 text-wewin-navy"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="p-5 space-y-3">
        {section.questions.map((q) => (
          <WorksheetQuestionRow
            key={q.id}
            question={q}
            type={section.type}
            value={answers[q.id] || ""}
            onChange={(val) => onAnswerChange(q.id, val)}
            isEvaluated={evaluation !== null}
            isCorrect={evaluation ? evaluation.results[q.id] : undefined}
          />
        ))}
      </div>

      {/* Section Footer Actions */}
      <div className="px-5 py-3.5 bg-wewin-bg border-t border-wewin-border flex items-center justify-end gap-2.5">
        {evaluation ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-wewin-border text-wewin-navy hover:bg-wewin-accent-blue-bg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Làm lại phần này
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCheck}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-wewin-navy hover:bg-wewin-navy-hover text-white shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Kiểm tra đáp án phần {section.sectionKey}
          </button>
        )}
      </div>
    </div>
  );
}

