"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import {
  AVATAR_CROP_THRESHOLD_PX,
  cropImageToSquareDataUrl,
  loadImageFromFile,
  loadImageFromUrl,
} from "@/lib/avatar";
import { useTranslations } from "@/i18n/provider";

type Props = {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  saving?: boolean;
};

export function AvatarCropModal({
  open,
  imageSrc,
  onClose,
  onSave,
  saving = false,
}: Props) {
  const { t } = useTranslations("profile");
  const { t: tc } = useTranslations("common");
  const [zoom, setZoom] = useState(1);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !imageSrc) return;
    let cancelled = false;
    setZoom(1);
    setError(null);
    setImg(null);
    loadImageFromUrl(imageSrc)
      .then((loaded) => {
        if (!cancelled) setImg(loaded);
      })
      .catch(() => {
        if (!cancelled) setError(t("imageLoadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [open, imageSrc, t]);

  const drawPreview = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas || !img) return;
    const size = canvas.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const z = Math.max(1, zoom);
    const srcSide = Math.min(img.naturalWidth, img.naturalHeight) / z;
    const sx = (img.naturalWidth - srcSide) / 2;
    const sy = (img.naturalHeight - srcSide) / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, srcSide, srcSide, 0, 0, size, size);
    ctx.restore();

    // Ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [img, zoom]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  if (!open) return null;

  function handleSave() {
    if (!img) return;
    try {
      const dataUrl = cropImageToSquareDataUrl(img, zoom);
      onSave(dataUrl);
    } catch {
      setError(t("cropError"));
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/50"
        aria-label={tc("close")}
        onClick={onClose}
        disabled={saving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="relative z-10 flex max-h-[min(92vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-wewin-border px-4 py-3 sm:px-5">
          <h2
            id="avatar-crop-title"
            className="min-w-0 text-base font-bold text-zinc-900 sm:text-lg"
          >
            {t("pickTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-50"
            aria-label={tc("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="relative flex h-[min(70vw,280px)] w-[min(70vw,280px)] items-center justify-center rounded-lg bg-zinc-900/10">
            <canvas
              ref={previewRef}
              width={280}
              height={280}
              className="h-full w-full rounded-full"
            />
          </div>

          <div className="flex w-full max-w-xs items-center gap-3">
            <ImageIcon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 w-full min-w-0 accent-wewin-navy"
              aria-label={t("zoom")}
              disabled={!img || saving}
            />
            <ImageIcon className="h-6 w-6 shrink-0 text-zinc-500" aria-hidden />
          </div>

          {error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-wewin-border px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-200 disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!img || saving}
            className="rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-50"
          >
            {saving ? t("saving") : tc("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function prepareUploadForCrop(file: File): Promise<{
  needsCrop: boolean;
  objectUrl: string;
  img: HTMLImageElement;
}> {
  const img = await loadImageFromFile(file);
  const objectUrl = URL.createObjectURL(file);
  const needsCrop =
    img.naturalWidth > AVATAR_CROP_THRESHOLD_PX ||
    img.naturalHeight > AVATAR_CROP_THRESHOLD_PX ||
    img.naturalWidth !== img.naturalHeight;
  return { needsCrop, objectUrl, img };
}
