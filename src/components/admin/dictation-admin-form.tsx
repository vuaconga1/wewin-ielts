"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startNavProgress } from "@/lib/client/nav-progress";
import { Loader2, Upload } from "lucide-react";
import type { DictationMode, DictationSettings, FillBlankGap } from "@/lib/dictation/types";
import { readGaps } from "@/lib/dictation/fill-blank";
import { adminListeningExerciseHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FillBlankGapEditor } from "@/components/admin/fill-blank-gap-editor";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type DictationFormValues = {
  id?: string;
  title: string;
  level: string;
  instructions: string;
  audioUrl: string;
  transcript: string;
  mode: DictationMode;
  gaps: FillBlankGap[];
  settings: DictationSettings;
  status: Status;
  order: number;
};

const STATUSES: Status[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";

export function DictationAdminForm({ initial }: { initial: DictationFormValues }) {
  const { t } = useTranslations("dictationAdmin");
  const { t: tErrors } = useTranslations("errors");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial.id);

  const [title, setTitle] = useState(initial.title);
  const [level, setLevel] = useState(initial.level);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [audioUrl, setAudioUrl] = useState(initial.audioUrl);
  const [transcript, setTranscript] = useState(initial.transcript);
  const mode = initial.mode;
  const [gaps, setGaps] = useState<FillBlankGap[]>(initial.gaps);
  const [gapsDropped, setGapsDropped] = useState(false);
  const [maxListen, setMaxListen] = useState(
    initial.settings.maxListenCount == null ? "" : String(initial.settings.maxListenCount),
  );
  const [status, setStatus] = useState<Status>(initial.status);
  const [order, setOrder] = useState(String(initial.order));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function codeMessage(code: string | undefined, fallbackKey: string, fallback: string, raw?: unknown) {
    if (code) return t(`errors.${code}`, t(`errors.${fallbackKey}`, fallback));
    return friendlyError(raw, t(`errors.${fallbackKey}`, fallback), tErrors).message;
  }

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/dictation/audio", { method: "POST", body: form });
      const data = (await res.json()) as { audioUrl?: string; code?: string; error?: string };
      if (!res.ok || !data.audioUrl) {
        setError(codeMessage(data.code, "uploadFailed", "Không tải được audio lên. Thử lại.", data.error));
        return;
      }
      setAudioUrl(data.audioUrl);
    } catch (e) {
      setError(codeMessage(undefined, "uploadFailed", "Không tải được audio lên. Thử lại.", e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onTranscriptChange(next: string) {
    setTranscript(next);
    const kept = readGaps(gaps, next);
    if (kept.length !== gaps.length) {
      setGaps(kept);
      setGapsDropped(true);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (mode === "FILL_BLANK" && gaps.length === 0) {
      setError(t("errors.NO_GAPS", "Bài nghe điền từ cần ít nhất một ô trống."));
      return;
    }
    setSaving(true);
    try {
      const body = {
        title,
        level,
        instructions,
        audioUrl,
        transcript,
        mode,
        gaps: mode === "FILL_BLANK" ? gaps : [],
        status,
        order: Number(order) || 0,
        settings: {
          maxListenCount: maxListen.trim() ? Number(maxListen) : null,
          playbackRates: initial.settings.playbackRates,
          scoringMode: "LEARNING",
        },
      };
      const res = await fetch(
        isEdit ? `/api/admin/dictation/${initial.id}` : "/api/admin/dictation",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await res.json()) as { id?: string; code?: string; error?: string };
      if (!res.ok) {
        setError(codeMessage(data.code, "saveFailed", "Không lưu được bài. Thử lại.", data.error));
        return;
      }
      if (isEdit) {
        setSaved(true);
        router.refresh();
      } else {
        startNavProgress();
        router.push(adminListeningExerciseHref(mode));
        router.refresh();
      }
    } catch (err) {
      setError(codeMessage(undefined, "saveFailed", "Không lưu được bài. Thử lại.", err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-outline max-w-3xl min-w-0 space-y-4 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldTitle", "Tiêu đề")}</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </label>
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldLevel", "Trình độ")}</span>
          <input value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls} />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-zinc-800">{t("fieldInstructions", "Hướng dẫn")}</span>
        <textarea
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className={inputCls}
        />
      </label>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-zinc-800">{t("fieldAudio", "Audio")}</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder={t("audioUrlPlaceholder", "URL audio")}
            className={`${inputCls} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? t("uploading", "Đang tải lên…") : t("uploadAudio", "Tải file audio")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </div>
        {audioUrl ? <audio src={audioUrl} controls preload="none" className="w-full" /> : null}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-zinc-800">{t("fieldTranscript", "Transcript")}</span>
        <textarea
          required
          rows={5}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          className={inputCls}
        />
        <span className="block text-xs text-zinc-500">
          {mode === "FILL_BLANK"
            ? t("transcriptHintFillBlank", "Học viên chỉ thấy transcript với các ô trống; đáp án chỉ trả về sau khi nộp bài.")
            : t("transcriptHint", "Chỉ dùng ở server khi chấm; học viên không thấy trước khi nộp bài.")}
        </span>
      </label>

      {mode === "FILL_BLANK" ? (
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-zinc-800">{t("fieldGaps", "Ô trống")}</span>
          {gapsDropped ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("gapsDropped", "Transcript đã thay đổi nên một số ô trống không còn hợp lệ và đã bị bỏ. Kiểm tra lại danh sách.")}
            </p>
          ) : null}
          <FillBlankGapEditor transcript={transcript} gaps={gaps} onChange={setGaps} />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldMaxListen", "Số lần nghe tối đa")}</span>
          <input
            type="number"
            min={1}
            value={maxListen}
            onChange={(e) => setMaxListen(e.target.value)}
            className={inputCls}
          />
          <span className="block text-xs text-zinc-500">{t("maxListenHint", "Để trống = không giới hạn")}</span>
        </label>
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldStatus", "Trạng thái")}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldOrder", "Thứ tự hiển thị")}</span>
          <input
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-emerald-700">{t("saved", "Đã lưu.")}</p> : null}

      <button
        type="submit"
        disabled={saving || uploading}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? t("saving", "Đang lưu…") : isEdit ? t("save", "Lưu") : t("create", "Tạo bài")}
      </button>
    </form>
  );
}
