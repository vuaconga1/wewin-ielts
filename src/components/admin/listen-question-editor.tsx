"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, CircleDashed, Plus, Trash2, X } from "lucide-react";
import type { ListenQuestion, ListenQuestionMatch, ListenQuestionResult } from "@/lib/dictation/types";
import {
  gradeQuestion,
  MAX_QUESTIONS,
  MAX_WORDS_LIMIT,
  parseQuestionsJson,
  validateQuestions,
} from "@/lib/dictation/listen-answer";
import { useTranslations } from "@/i18n/provider";

export type QuestionDraft = {
  id: string;
  prompt: string;
  answersText: string;
  rejectText: string;
  match: ListenQuestionMatch;
  maxWords: string;
};

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";

const JSON_SAMPLE = `[
  {
    "question": "Who takes out the trash?",
    "correctAnswers": ["John"],
    "match": "KEYWORD"
  },
  {
    "question": "Who sweeps the floor, Kathy or James?",
    "correctAnswers": ["Kathy"],
    "rejectAnswers": ["James"]
  }
]`;

function splitVariants(text: string): string[] {
  return text
    .split(/[\n;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toQuestionDrafts(questions: ListenQuestion[]): QuestionDraft[] {
  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    answersText: q.answers.join("\n"),
    rejectText: (q.rejectAnswers ?? []).join("\n"),
    match: q.match,
    maxWords: q.maxWords == null ? "" : String(q.maxWords),
  }));
}

/** Raw question objects for the API; the server re-validates. */
export function fromQuestionDrafts(drafts: QuestionDraft[]) {
  return drafts.map((d) => ({
    id: d.id,
    prompt: d.prompt,
    answers: splitVariants(d.answersText),
    rejectAnswers: d.match === "KEYWORD" ? splitVariants(d.rejectText) : [],
    match: d.match,
    maxWords: d.maxWords.trim() ? Number(d.maxWords) : null,
  }));
}

function idNumber(id: string): number {
  const m = /^q(\d+)$/.exec(id);
  return m ? Number(m[1]) : 0;
}

function nextIdBase(drafts: QuestionDraft[]): number {
  return drafts.reduce((n, d) => Math.max(n, idNumber(d.id)), 0) + 1;
}

type Props = {
  drafts: QuestionDraft[];
  onChange: (drafts: QuestionDraft[]) => void;
};

export function ListenQuestionEditor({ drafts, onChange }: Props) {
  const { t } = useTranslations("dictationAdmin");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [trials, setTrials] = useState<Record<string, string>>({});

  function update(id: string, patch: Partial<QuestionDraft>) {
    onChange(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= drafts.length) return;
    const next = [...drafts];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    if (drafts.length >= MAX_QUESTIONS) return;
    onChange([
      ...drafts,
      {
        id: `q${nextIdBase(drafts)}`,
        prompt: "",
        answersText: "",
        rejectText: "",
        match: "KEYWORD",
        maxWords: "",
      },
    ]);
  }

  function importJson() {
    setJsonError(null);
    const base = nextIdBase(drafts);
    try {
      const parsed = parseQuestionsJson(jsonText, (i) => `q${base + i}`);
      if (drafts.length + parsed.length > MAX_QUESTIONS) {
        setJsonError(t("qLimit", { n: MAX_QUESTIONS }, "Tối đa {n} câu hỏi."));
        return;
      }
      onChange([...drafts, ...toQuestionDrafts(parsed)]);
      setJsonText("");
    } catch {
      setJsonError(
        t(
          "qJsonInvalid",
          "JSON không hợp lệ. Mỗi câu cần có nội dung câu hỏi và ít nhất một đáp án chấp nhận.",
        ),
      );
    }
  }

  function issueOf(d: QuestionDraft): string | null {
    if (!d.prompt.trim()) return t("qPromptMissing", "Chưa nhập câu hỏi.");
    if (splitVariants(d.answersText).length === 0) {
      return t("qAnswersMissing", "Cần ít nhất một đáp án chấp nhận.");
    }
    try {
      validateQuestions(fromQuestionDrafts([d]));
      return null;
    } catch {
      return t(
        "qInvalid",
        "Câu hỏi chưa hợp lệ: phương án sai không được trùng đáp án đúng, giới hạn từ phải từ 1 đến 50.",
      );
    }
  }

  function trialResult(d: QuestionDraft): ListenQuestionResult | null {
    const text = trials[d.id];
    if (!text?.trim()) return null;
    try {
      const [q] = validateQuestions(fromQuestionDrafts([d]));
      return gradeQuestion(q, text);
    } catch {
      return null;
    }
  }

  const reasonLabel = (r: ListenQuestionResult) =>
    r.reason === "TOO_MANY_WORDS"
      ? t("qReasonTooManyWords", "vượt giới hạn số từ")
      : r.reason === "WRONG_OPTION"
        ? t("qReasonWrongOption", "có nhắc tới phương án sai")
        : r.reason === "NEGATED"
          ? t("qReasonNegated", "câu trả lời mang nghĩa phủ định")
          : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        {t(
          "qHint",
          "Chấm tự động bằng quy tắc, không dùng AI: không phân biệt hoa/thường, bỏ qua dấu câu và khoảng trắng thừa. “Chứa từ khóa”: câu trả lời đúng nếu có chứa một đáp án (VD đáp án “John” → “It is John” vẫn đúng). “Khớp chính xác”: phải trùng một đáp án đã khai báo.",
        )}
      </p>

      {drafts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
          {t("qEmpty", "Chưa có câu hỏi nào.")}
        </p>
      ) : (
        <ol className="space-y-3">
          {drafts.map((d, i) => {
            const issue = issueOf(d);
            const trial = trialResult(d);
            const reason = trial ? reasonLabel(trial) : null;
            return (
              <li key={d.id} className="min-w-0 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-wewin-navy">
                    {t("qNumber", { n: i + 1 }, "Câu {n}")}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={t("qMoveUp", "Đưa lên")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === drafts.length - 1}
                      aria-label={t("qMoveDown", "Đưa xuống")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(drafts.filter((x) => x.id !== d.id))}
                      aria-label={t("qRemove", "Xóa câu hỏi")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-zinc-700">{t("qPrompt", "Câu hỏi (tiếng Anh)")}</span>
                  <input
                    value={d.prompt}
                    onChange={(e) => update(d.id, { prompt: e.target.value })}
                    placeholder="Who takes out the trash?"
                    className={inputCls}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-zinc-700">
                      {t("qAnswers", "Đáp án chấp nhận (mỗi dòng một đáp án, dòng đầu là đáp án mẫu)")}
                    </span>
                    <textarea
                      rows={3}
                      value={d.answersText}
                      onChange={(e) => update(d.id, { answersText: e.target.value })}
                      placeholder={"John"}
                      className={inputCls}
                    />
                  </label>
                  {d.match === "KEYWORD" ? (
                    <label className="block min-w-0 space-y-1">
                      <span className="text-xs font-semibold text-zinc-700">
                        {t("qReject", "Phương án sai (tùy chọn) — nhắc tới sẽ bị tính sai")}
                      </span>
                      <textarea
                        rows={3}
                        value={d.rejectText}
                        onChange={(e) => update(d.id, { rejectText: e.target.value })}
                        placeholder={"James"}
                        className={inputCls}
                      />
                      <span className="block text-xs text-zinc-500">
                        {t("qRejectHint", "Dùng cho câu hỏi chọn A hay B: “Kathy or James” sẽ không được tính đúng.")}
                      </span>
                    </label>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-zinc-700">{t("qMatch", "Cách chấm")}</span>
                    <select
                      value={d.match}
                      onChange={(e) => update(d.id, { match: e.target.value as ListenQuestionMatch })}
                      className={inputCls}
                    >
                      <option value="KEYWORD">{t("qMatchKeyword", "Chứa từ khóa / đáp án")}</option>
                      <option value="EXACT">{t("qMatchExact", "Khớp chính xác")}</option>
                    </select>
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-zinc-700">
                      {t("qMaxWords", "Giới hạn số từ (để trống = không giới hạn)")}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_WORDS_LIMIT}
                      value={d.maxWords}
                      onChange={(e) => update(d.id, { maxWords: e.target.value })}
                      className={inputCls}
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-zinc-700">
                      {t("qTrial", "Thử chấm một câu trả lời")}
                    </span>
                    <input
                      value={trials[d.id] ?? ""}
                      onChange={(e) => setTrials((s) => ({ ...s, [d.id]: e.target.value }))}
                      placeholder={t("qTrialPlaceholder", "Gõ thử như học viên…")}
                      className={inputCls}
                    />
                  </label>
                  {trial ? (
                    <p
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
                        trial.status === "correct"
                          ? "bg-emerald-50 text-emerald-800"
                          : trial.status === "incorrect"
                            ? "bg-rose-50 text-rose-800"
                            : "bg-orange-50 text-orange-800"
                      }`}
                    >
                      {trial.status === "correct" ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : trial.status === "incorrect" ? (
                        <X className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <CircleDashed className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {trial.status === "correct" ? t("qTrialCorrect", "Đúng") : t("qTrialIncorrect", "Sai")}
                      {reason ? <span className="font-normal">— {reason}</span> : null}
                    </p>
                  ) : null}
                </div>

                {issue ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{issue}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      <button
        type="button"
        onClick={add}
        disabled={drafts.length >= MAX_QUESTIONS}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-wewin-navy/30 bg-white px-4 py-2 text-sm font-semibold text-wewin-navy hover:bg-wewin-accent-blue-bg disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {t("qAdd", "Thêm câu hỏi")}
      </button>

      <details className="rounded-xl border border-zinc-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          {t("qJsonTitle", "Dán câu hỏi dạng JSON (VD do AI tạo kèm nội dung bài)")}
        </summary>
        <div className="mt-3 space-y-2">
          <textarea
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={JSON_SAMPLE}
            spellCheck={false}
            className={`${inputCls} font-mono text-xs`}
          />
          {jsonError ? (
            <p className="text-sm text-rose-600" role="alert">
              {jsonError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={importJson}
            disabled={!jsonText.trim()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-50"
          >
            {t("qJsonImport", "Thêm các câu hỏi này")}
          </button>
        </div>
      </details>
    </div>
  );
}
