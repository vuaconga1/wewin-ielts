"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { WorksheetSection } from "@/lib/learn/worksheet-types";
import { WorksheetQuestionRow } from "./worksheet-question-row";
import { checkAnswer, hasAnswerKey } from "@/lib/learn/worksheet-grader";
import { useTranslations } from "@/i18n/provider";

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
  const { t } = useTranslations("worksheet");
  const [evaluation, setEvaluation] = useState<{
    results: Record<string, boolean>;
    score: number;
    total: number;
    ungraded: number;
  } | null>(null);

  const handleCheck = () => {
    const results: Record<string, boolean> = {};
    let score = 0;
    let total = 0;

    for (const q of section.questions) {
      if (!hasAnswerKey(q.acceptedAnswers)) continue;
      total += 1;
      const userVal = answers[q.id] || "";
      const res = checkAnswer(userVal, q.acceptedAnswers);
      results[q.id] = res.isCorrect;
      if (res.isCorrect) score += 1;
    }

    const ungraded = section.questions.length - total;
    setEvaluation({ results, score, total, ungraded });
    if (onSectionEvaluated) {
      onSectionEvaluated(score, total);
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
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="min-w-7 h-7 px-1.5 whitespace-nowrap rounded-lg bg-wewin-navy text-wewin-gold-soft shrink-0 font-bold flex items-center justify-center text-sm shadow-xs">
            {section.sectionKey}
          </span>
          <h3 className="font-semibold text-wewin-navy text-base break-words min-w-0">
            {section.instruction}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {evaluation && evaluation.total > 0 && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                evaluation.score === evaluation.total
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-wewin-accent-blue-bg text-wewin-navy"
              }`}
            >
              {t("scoreCorrect", { correct: evaluation.score, total: evaluation.total })}
            </span>
          )}
          {evaluation && evaluation.ungraded > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-wewin-gold/15 text-[#7a5f12]">
              {t("ungradedCount", { n: evaluation.ungraded })}
            </span>
          )}
          <span className="text-xs text-zinc-500 font-medium">
            {t("questionCount", { n: section.questions.length })}
          </span>
        </div>
      </div>

      {/* Word bank / Context if available */}
      {section.wordBank && section.wordBank.length > 0 && (
        <div className="p-4 bg-wewin-gold/10 border-b border-wewin-gold/25">
          <p className="text-xs font-semibold text-[#7a5f12] uppercase tracking-wider mb-2">
            {t("wordBank")}
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

      {section.contextText && (
        <div className="px-5 py-4 border-b border-wewin-border bg-white text-sm leading-relaxed text-zinc-800 whitespace-pre-line break-words">
          {section.contextText}
        </div>
      )}

      {section.tableData && section.tableData.rows.length > 0 && (
        <div className="px-5 py-4 border-b border-wewin-border bg-white overflow-x-auto">
          <table className="min-w-full text-sm border border-wewin-border">
            {section.tableData.headers.length > 0 && (
              <thead className="bg-wewin-accent-blue-bg/60 text-wewin-navy">
                <tr>
                  {section.tableData.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold border border-wewin-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {section.tableData.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 text-zinc-800 border border-wewin-border align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
            <RotateCcw className="w-3.5 h-3.5" /> {t("resetSection")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCheck}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-wewin-navy hover:bg-wewin-navy-hover text-white shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {t("checkSection", { key: section.sectionKey })}
          </button>
        )}
      </div>
    </div>
  );
}
