"use client";

import React from "react";
import { Check, X, HelpCircle } from "lucide-react";
import type { WorksheetQuestion, WorksheetQuestionType } from "@/lib/learn/worksheet-types";

interface Props {
  question: WorksheetQuestion;
  type: WorksheetQuestionType;
  value: string;
  onChange: (val: string) => void;
  isEvaluated: boolean;
  isCorrect?: boolean;
}

export function WorksheetQuestionRow({
  question,
  type,
  value,
  onChange,
  isEvaluated,
  isCorrect,
}: Props) {
  const parts = question.prompt.split("[gap]");
  const gapCount = Math.max(0, parts.length - 1);
  const valParts = value ? value.split(" / ") : [];

  const getValForIdx = (idx: number) => {
    if (gapCount <= 1) return value;
    return valParts[idx] || "";
  };

  const handleValChange = (idx: number, newVal: string) => {
    if (gapCount <= 1) {
      onChange(newVal);
    } else {
      const nextVals = Array.from({ length: gapCount }, (_, i) =>
        i === idx ? newVal : valParts[i] || ""
      );
      onChange(nextVals.join(" / "));
    }
  };

  const isSentenceInputType = [
    "sentence_rewrite",
    "sentence_building",
    "sentence_combine",
    "question_formation",
    "reading_qa",
    "error_correction",
  ].includes(type);

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isEvaluated
          ? isCorrect
            ? "border-emerald-300 bg-emerald-50/50"
            : "border-rose-300 bg-rose-50/50"
          : "border-wewin-border hover:border-wewin-accent-blue/40 bg-white"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xs font-semibold text-zinc-400 mt-1 min-w-[1.5rem]">
          {question.order}.
        </span>

        <div className="flex-1">
          {/* Multiple Choice Render */}
          {type === "multiple_choice" && question.options && question.options.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-zinc-800 mb-2">
                {question.prompt.replace("[gap]", "______")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {question.options.map((opt, i) => {
                  const letterMatch = opt.match(/^([a-d])\)/i);
                  const optKey = letterMatch ? letterMatch[1].toLowerCase() : String.fromCharCode(97 + i);
                  const isSelected = value.trim().toLowerCase() === optKey;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !isEvaluated && onChange(optKey)}
                      disabled={isEvaluated}
                      className={`text-left text-sm px-3 py-2 rounded-md border transition-all ${
                        isSelected
                          ? isEvaluated
                            ? isCorrect
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-rose-600 text-white border-rose-600"
                            : "bg-wewin-navy text-white border-wewin-navy shadow-sm"
                          : "bg-wewin-bg hover:bg-wewin-accent-blue-bg text-zinc-700 border-wewin-border"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isSentenceInputType ? (
            /* Sentence Rewrite / Building / Formation / Combine Render */
            <div>
              <p className="text-sm font-medium text-zinc-800 mb-2 leading-relaxed">
                {question.prompt.replace(/\[gap\]/g, "").trim()}
              </p>
              {question.sampleAnswer && (
                <p className="text-xs text-zinc-500 italic mb-2">
                  {question.sampleAnswer}
                </p>
              )}
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isEvaluated}
                placeholder="Gõ câu trả lời của bạn..."
                className="w-full text-sm px-3 py-2 rounded-md border border-wewin-border bg-white focus:outline-none focus:border-wewin-accent-blue focus:ring-2 focus:ring-wewin-accent-blue/20"
              />
            </div>
          ) : (
            /* Inline Gap Fill / Verb Conjugation Render */
            <div className="text-sm font-medium text-zinc-800 leading-loose">
              {parts.map((segment, idx) => (
                <React.Fragment key={idx}>
                  <span>{segment}</span>
                  {idx < parts.length - 1 && (
                    <input
                      type="text"
                      value={getValForIdx(idx)}
                      onChange={(e) => handleValChange(idx, e.target.value)}
                      disabled={isEvaluated}
                      placeholder="..."
                      className={`inline-block mx-1.5 px-2.5 py-1 text-sm font-semibold rounded border text-center transition-all ${
                        isEvaluated
                          ? isCorrect
                            ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                            : "bg-rose-100 text-rose-800 border-rose-400"
                          : "bg-wewin-bg border-wewin-border text-wewin-navy hover:border-wewin-accent-blue/60 focus:border-wewin-accent-blue focus:bg-white"
                      } focus:outline-none focus:ring-2 focus:ring-wewin-accent-blue/20`}
                      style={{ minWidth: "120px", maxWidth: "260px" }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Feedback & Accepted Answers on evaluation */}
          {isEvaluated && (
            <div className="mt-2.5 pt-2 border-t border-wewin-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Chính xác
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
                    <X className="w-3.5 h-3.5" /> Chưa chính xác
                  </span>
                )}
                {!isCorrect && question.acceptedAnswers.length > 0 && (
                  <span className="text-zinc-500 ml-2">
                    Đáp án đúng:{" "}
                    <strong className="text-emerald-700">
                      {question.acceptedAnswers[0]}
                    </strong>
                  </span>
                )}
              </div>

              {question.explanation && (
                <div className="text-zinc-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-wewin-accent-blue" />
                  <span>{question.explanation}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

