"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { FillBlankGap } from "@/lib/dictation/types";
import {
  buildPublicSegments,
  gapExpected,
  hiddenRatio,
  MAX_GAPS,
  tokenizeTranscript,
} from "@/lib/dictation/fill-blank";
import { useTranslations } from "@/i18n/provider";

const HIGH_HIDDEN_RATIO = 0.5;

type Props = {
  transcript: string;
  gaps: FillBlankGap[];
  onChange: (gaps: FillBlankGap[]) => void;
};

function nextGapId(gaps: FillBlankGap[]): string {
  const max = gaps.reduce((n, g) => {
    const m = /^g(\d+)$/.exec(g.id);
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `g${max + 1}`;
}

function parseAccepted(text: string): string[] {
  return text
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function FillBlankGapEditor({ transcript, gaps, onChange }: Props) {
  const { t } = useTranslations("dictationAdmin");
  const tokens = useMemo(() => tokenizeTranscript(transcript), [transcript]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [activeGapId, setActiveGapId] = useState<string | null>(null);

  const gapAt = useMemo(() => {
    const map = new Map<number, { gap: FillBlankGap; index: number }>();
    gaps.forEach((gap, index) => {
      for (let i = gap.startToken; i < gap.endToken; i++) map.set(i, { gap, index });
    });
    return map;
  }, [gaps]);

  const selection =
    anchor == null
      ? null
      : {
          start: Math.min(anchor, focus ?? anchor),
          end: Math.max(anchor, focus ?? anchor) + 1,
        };

  let selectionError: string | null = null;
  if (selection) {
    const first = tokens[selection.start];
    const last = tokens[selection.end - 1];
    let overlaps = false;
    for (let i = selection.start; i < selection.end; i++) if (gapAt.has(i)) overlaps = true;
    if (overlaps) selectionError = t("gapOverlap", "Vùng chọn trùng với ô trống đã có.");
    else if (!first || !last || first.coreStart === first.coreEnd || last.coreStart === last.coreEnd) {
      selectionError = t("gapPunctuation", "Ô trống không được bắt đầu hoặc kết thúc bằng dấu câu.");
    } else if (gaps.length >= MAX_GAPS) {
      selectionError = t("gapLimit", { n: MAX_GAPS }, "Tối đa {n} ô trống.");
    }
  }

  function clearSelection() {
    setAnchor(null);
    setFocus(null);
  }

  function onToken(i: number) {
    const hit = gapAt.get(i);
    if (hit) {
      clearSelection();
      setActiveGapId(hit.gap.id === activeGapId ? null : hit.gap.id);
      return;
    }
    setActiveGapId(null);
    if (anchor == null) {
      setAnchor(i);
      setFocus(null);
    } else if (i === anchor && focus == null) {
      clearSelection();
    } else {
      setFocus(i);
    }
  }

  function createGap() {
    if (!selection || selectionError) return;
    const gap: FillBlankGap = { id: nextGapId(gaps), startToken: selection.start, endToken: selection.end };
    onChange([...gaps, gap].sort((a, b) => a.startToken - b.startToken));
    clearSelection();
    setActiveGapId(gap.id);
  }

  function removeGap(id: string) {
    onChange(gaps.filter((g) => g.id !== id));
    if (activeGapId === id) setActiveGapId(null);
  }

  function setAccepted(id: string, text: string) {
    const acceptedAnswers = parseAccepted(text);
    onChange(
      gaps.map((g) =>
        g.id !== id
          ? g
          : { id: g.id, startToken: g.startToken, endToken: g.endToken, ...(acceptedAnswers.length ? { acceptedAnswers } : {}) },
      ),
    );
  }

  if (tokens.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
        {t("gapNeedTranscript", "Nhập transcript trước, sau đó chọn từ để tạo ô trống.")}
      </p>
    );
  }

  const ratio = hiddenRatio(transcript, gaps);
  const preview = gaps.length ? buildPublicSegments(transcript, gaps) : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">
          {t(
            "gapHint",
            "Bấm một từ để bắt đầu chọn, bấm thêm một từ khác để mở rộng thành cụm, rồi bấm “Tạo ô trống”. Bấm vào ô đã tạo để sửa.",
          )}
        </p>
        <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed">
          {tokens.map((tok, i) => {
            const hit = gapAt.get(i);
            const selected = selection && i >= selection.start && i < selection.end;
            let cls = "border-transparent text-zinc-800 hover:bg-zinc-100";
            if (hit) {
              cls =
                hit.gap.id === activeGapId
                  ? "border-wewin-navy bg-wewin-navy text-white"
                  : "border-wewin-navy/40 bg-wewin-accent-blue-bg text-wewin-navy";
            } else if (selected) {
              cls = "border-amber-400 bg-amber-50 text-amber-900";
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToken(i)}
                aria-pressed={Boolean(selected || hit)}
                className={`rounded-md border px-1 py-0.5 ${cls}`}
              >
                {hit && hit.gap.startToken === i ? (
                  <sup className="mr-0.5 font-bold">{hit.index + 1}</sup>
                ) : null}
                {tok.raw}
              </button>
            );
          })}
        </div>
        {selection ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={createGap}
              disabled={Boolean(selectionError)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t("gapCreate", "Tạo ô trống")}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
              {t("gapClearSelection", "Bỏ chọn")}
            </button>
            {selectionError ? <span className="text-sm text-rose-600">{selectionError}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-800">
          {t("gapListTitle", { n: gaps.length }, "Danh sách ô trống ({n})")}
        </p>
        {gaps.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("gapEmpty", "Chưa có ô trống nào.")}</p>
        ) : (
          <ol className="space-y-2">
            {gaps.map((gap, index) => (
              <li
                key={gap.id}
                className={`min-w-0 rounded-xl border p-3 ${
                  gap.id === activeGapId ? "border-wewin-navy bg-wewin-accent-blue-bg/40" : "border-zinc-200"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wewin-navy text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-semibold text-zinc-900">
                    {gapExpected(transcript, tokens, gap)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGap(gap.id)}
                    aria-label={t("gapRemove", "Xóa ô trống")}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-sm text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("delete", "Xóa")}</span>
                  </button>
                </div>
                <label className="mt-2 block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">
                    {t("gapAccepted", "Đáp án thay thế được chấp nhận (cách nhau bằng dấu ;)")}
                  </span>
                  <input
                    key={`${gap.id}:${(gap.acceptedAnswers ?? []).join(";")}`}
                    defaultValue={(gap.acceptedAnswers ?? []).join("; ")}
                    onBlur={(e) => setAccepted(gap.id, e.target.value)}
                    placeholder={t("gapAcceptedPlaceholder", "VD: 8:30; eight thirty")}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
                  />
                </label>
              </li>
            ))}
          </ol>
        )}
        {ratio > HIGH_HIDDEN_RATIO ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t(
              "gapRatioWarning",
              { pct: Math.round(ratio * 100) },
              "Đang ẩn {pct}% transcript — học viên có thể thiếu ngữ cảnh. Bạn vẫn có thể lưu.",
            )}
          </p>
        ) : null}
      </div>

      {preview.length ? (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-zinc-800">{t("gapPreview", "Xem trước (giao diện học viên)")}</p>
          <p className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-3 text-base leading-loose text-zinc-800">
            {preview.map((seg, i) =>
              seg.type === "text" ? (
                <span key={i}>{seg.text}</span>
              ) : (
                <span
                  key={i}
                  className="mx-0.5 inline-block min-w-[6ch] rounded-md border border-zinc-300 bg-white px-2 text-center align-baseline text-sm text-zinc-400"
                >
                  {seg.index + 1}
                </span>
              ),
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
