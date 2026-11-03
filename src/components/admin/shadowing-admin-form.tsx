"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { startNavProgress } from "@/lib/client/nav-progress";
import { MAX_RECORD_SECONDS, MIN_RECORD_SECONDS } from "@/lib/shadowing/types";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";
import {
  ShadowingAnnotationsEditor,
  type AnnotationRow,
} from "@/components/admin/shadowing-annotations-editor";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ShadowingFormValues = {
  id?: string;
  slug?: string;
  cuesValid?: boolean;
  title: string;
  level: string;
  instructions: string;
  audioUrl: string;
  videoUrl: string;
  transcript: string;
  maxRecordSeconds: number;
  status: Status;
  order: number;
  annotations?: AnnotationRow[];
};

const STATUSES: Status[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";

export function ShadowingAdminForm({ initial }: { initial: ShadowingFormValues }) {
  const { t } = useTranslations("shadowingAdmin");
  const { t: tErrors } = useTranslations("errors");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial.id);

  const [title, setTitle] = useState(initial.title);
  const [level, setLevel] = useState(initial.level);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [audioUrl, setAudioUrl] = useState(initial.audioUrl);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [transcript, setTranscript] = useState(initial.transcript);
  const [maxSeconds, setMaxSeconds] = useState(String(initial.maxRecordSeconds));
  const [status, setStatus] = useState<Status>(initial.status);
  const [order, setOrder] = useState(String(initial.order));
  const [annotations, setAnnotations] = useState<AnnotationRow[]>(initial.annotations ?? []);
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
      const res = await fetch("/api/admin/shadowing/audio", { method: "POST", body: form });
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body = {
        title,
        level,
        instructions,
        audioUrl,
        videoUrl,
        transcript,
        maxRecordSeconds: Number(maxSeconds),
        status,
        order: Number(order) || 0,
        annotations,
      };
      const res = await fetch(isEdit ? `/api/admin/shadowing/${initial.id}` : "/api/admin/shadowing", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
        router.push("/admin/shadowing");
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
        <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} />
      </label>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-zinc-800">{t("fieldAudio", "Audio mẫu")}</span>
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
        <span className="text-sm font-semibold text-zinc-800">{t("fieldVideo", "Video mẫu (không bắt buộc)")}</span>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={t("videoUrlPlaceholder", "URL video (.mp4) trên R2")}
          className={inputCls}
        />
        <span className="block text-xs text-zinc-500">
          {t(
            "videoHint",
            "Có video thì học viên xem video thay cho audio; audio phía trên phải là âm thanh của chính video này. Dùng script npm run shadowing:import-video để tạo cả hai từ link YouTube.",
          )}
        </span>
        {videoUrl ? (
          <video src={videoUrl} controls preload="none" playsInline className="aspect-video w-full rounded-xl bg-black" />
        ) : null}
      </label>

      {/* Cues expired or missing warning for video exercises */}
      {isEdit && initial.videoUrl && initial.cuesValid === false ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
            <span>{t("cuesStaleWarning", "Mốc thời gian (cues) của video đã hết hạn hoặc chưa khớp transcript. Chạy lệnh sau để căn lại:")}</span>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-amber-100/90 p-2.5 font-mono text-xs font-semibold text-amber-950 select-all border border-amber-200">
            npx tsx scripts/shadowing-cues.ts --slug {initial.slug}
          </pre>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-zinc-800">{t("fieldTranscript", "Câu mẫu (transcript)")}</span>
        <textarea required rows={4} value={transcript} onChange={(e) => setTranscript(e.target.value)} className={inputCls} />
        <span className="block text-xs text-zinc-500">
          {t("transcriptHint", "Dùng làm đáp án chuẩn khi chấm; học viên chỉ thấy sau khi nộp bài.")}
        </span>
      </label>

      {/* Per-sentence IPA & translation editor */}
      <ShadowingAnnotationsEditor
        transcript={transcript}
        value={annotations}
        onChange={setAnnotations}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldMaxSeconds", "Thời lượng ghi âm tối đa (giây)")}</span>
          <input
            type="number"
            min={MIN_RECORD_SECONDS}
            max={MAX_RECORD_SECONDS}
            value={maxSeconds}
            onChange={(e) => setMaxSeconds(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldStatus", "Trạng thái")}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 space-y-1">
          <span className="text-sm font-semibold text-zinc-800">{t("fieldOrder", "Thứ tự hiển thị")}</span>
          <input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} className={inputCls} />
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
