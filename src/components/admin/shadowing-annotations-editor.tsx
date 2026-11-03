"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, ClipboardPaste, X } from "lucide-react";
import { transcriptLines } from "@/lib/shadowing/transcript";
import { sentenceKey } from "@/lib/shadowing/annotations";
import { useTranslations } from "@/i18n/provider";

export type AnnotationRow = {
  text: string;
  ipa: string;
  translation: string;
};

export type ShadowingAnnotationsEditorProps = {
  transcript: string;
  value: AnnotationRow[];
  onChange: (rows: AnnotationRow[]) => void;
};

const inputCls =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-wewin-navy focus:ring-1 focus:ring-wewin-navy";

export function ShadowingAnnotationsEditor({
  transcript,
  value,
  onChange,
}: ShadowingAnnotationsEditorProps) {
  const { t } = useTranslations("shadowingAdmin");
  const [fillingIpa, setFillingIpa] = useState(false);
  const [ipaError, setIpaError] = useState<string | null>(null);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);

  const lines = useMemo(() => transcriptLines(transcript), [transcript]);

  // Keep rows aligned with transcript sentences
  useEffect(() => {
    const byKey = new Map<string, AnnotationRow>();
    for (const r of value) byKey.set(sentenceKey(r.text), r);

    const synced: AnnotationRow[] = lines.map((l) => {
      const match = byKey.get(sentenceKey(l.text));
      return {
        text: l.text,
        ipa: match?.ipa ?? "",
        translation: match?.translation ?? "",
      };
    });

    const isDifferent =
      synced.length !== value.length ||
      synced.some(
        (s, i) =>
          s.text !== value[i]?.text ||
          s.ipa !== value[i]?.ipa ||
          s.translation !== value[i]?.translation,
      );

    if (isDifferent) {
      onChange(synced);
    }
  }, [lines, value, onChange]);

  const translatedCount = value.filter((r) => r.translation.trim().length > 0).length;

  const handleUpdate = (idx: number, patch: Partial<AnnotationRow>) => {
    const next = value.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };

  const onFillIpa = async () => {
    setIpaError(null);
    setFillingIpa(true);
    try {
      // Find rows missing IPA
      const missingIndices: number[] = [];
      const sentencesToQuery: string[] = [];
      value.forEach((r, idx) => {
        if (!r.ipa.trim()) {
          missingIndices.push(idx);
          sentencesToQuery.push(r.text);
        }
      });

      if (sentencesToQuery.length === 0) return;

      const res = await fetch("/api/admin/shadowing/ipa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentences: sentencesToQuery }),
      });

      if (!res.ok) throw new Error("IPA API failed");

      const data = (await res.json()) as { ipa?: string[] };
      if (!Array.isArray(data.ipa)) throw new Error("Invalid IPA response");

      const next = [...value];
      missingIndices.forEach((targetIdx, i) => {
        if (data.ipa && data.ipa[i]) {
          next[targetIdx] = { ...next[targetIdx], ipa: data.ipa[i] };
        }
      });

      onChange(next);
    } catch {
      setIpaError(t("errors.ipaFailed", "Không tạo được IPA tự động. Thử lại."));
    } finally {
      setFillingIpa(false);
    }
  };

  const applyPastedTranslations = () => {
    setPasteWarning(null);
    const rawLines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim());

    if (rawLines.length !== value.length) {
      setPasteWarning(
        t("pasteCountMismatch", { lines: rawLines.length, total: value.length }),
      );
    }

    const next = value.map((r, i) => {
      const pasted = rawLines[i];
      return pasted ? { ...r, translation: pasted } : r;
    });

    onChange(next);
    setPasteOpen(false);
    setPasteText("");
  };

  if (lines.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
      {/* Header & Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {t("annotationsTitle", "IPA & Bản dịch câu")}
          </h3>
          <p className="text-xs text-zinc-500">
            {t(
              "annotationsHint",
              "Điền phiên âm IPA và bản dịch tiếng Việt cho từng câu. Học viên có thể xem IPA và bật/tắt bản dịch khi luyện nói.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onFillIpa}
            disabled={fillingIpa}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 disabled:opacity-60"
          >
            {fillingIpa ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-wewin-navy" />
            )}
            {fillingIpa ? t("fillingIpa", "Đang điền IPA…") : t("fillIpa", "Điền IPA tự động")}
          </button>
          <button
            type="button"
            onClick={() => setPasteOpen((v) => !v)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50"
          >
            <ClipboardPaste className="h-3.5 w-3.5 text-zinc-600" />
            {t("pasteTranslations", "Dán bản dịch hàng loạt")}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{t("translationCount", { n: translatedCount, total: value.length })}</span>
      </div>

      {ipaError ? <p className="text-xs text-rose-600">{ipaError}</p> : null}
      {pasteWarning ? <p className="text-xs text-amber-600">{pasteWarning}</p> : null}

      {/* Paste Dialog / Expansion */}
      {pasteOpen ? (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700">
              {t("pasteTranslations", "Dán bản dịch hàng loạt")}
            </span>
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {t(
              "pasteTranslationsHint",
              "Dán các câu dịch tiếng Việt vào đây (mỗi dòng một câu ứng với một câu tiếng Anh theo thứ tự).",
            )}
          </p>
          <textarea
            rows={5}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Câu dịch 1\nCâu dịch 2\nCâu dịch 3"}
            className={inputCls}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="min-h-11 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              {t("close", "Đóng")}
            </button>
            <button
              type="button"
              onClick={applyPastedTranslations}
              className="inline-flex min-h-11 items-center rounded-lg bg-wewin-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-wewin-navy-hover"
            >
              {t("applyPaste", "Áp dụng bản dịch")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {value.map((row, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-xs"
          >
            <div className="flex items-start gap-2">
              <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-600">
                #{idx + 1}
              </span>
              <p className="break-words text-xs font-medium text-zinc-800">{row.text}</p>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500">
                {t("colIpa", "Phiên âm IPA")}
              </label>
              <input
                value={row.ipa}
                onChange={(e) => handleUpdate(idx, { ipa: e.target.value })}
                placeholder="/.../"
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500">
                {t("colTranslation", "Bản dịch tiếng Việt")}
              </label>
              <textarea
                rows={2}
                value={row.translation}
                onChange={(e) => handleUpdate(idx, { translation: e.target.value })}
                placeholder="Bản dịch tiếng Việt…"
                className={inputCls}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden max-h-[32rem] overflow-y-auto rounded-lg border border-zinc-200 bg-white md:block">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="w-10 px-2.5 py-2 text-center">#</th>
              <th className="w-2/5 px-3 py-2">{t("colSentence", "Câu tiếng Anh")}</th>
              <th className="w-1/4 px-3 py-2">{t("colIpa", "Phiên âm IPA")}</th>
              <th className="px-3 py-2">{t("colTranslation", "Bản dịch tiếng Việt")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {value.map((row, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/70">
                <td className="px-2.5 py-2 text-center font-mono text-zinc-400">{idx + 1}</td>
                <td className="px-3 py-2 align-top text-zinc-800">
                  <p className="break-words leading-relaxed">{row.text}</p>
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    value={row.ipa}
                    onChange={(e) => handleUpdate(idx, { ipa: e.target.value })}
                    placeholder="/.../"
                    className={`${inputCls} font-mono text-xs`}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    rows={2}
                    value={row.translation}
                    onChange={(e) => handleUpdate(idx, { translation: e.target.value })}
                    placeholder="Bản dịch…"
                    className={inputCls}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

