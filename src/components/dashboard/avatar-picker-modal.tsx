"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import {
  AvatarCropModal,
  prepareUploadForCrop,
} from "@/components/dashboard/avatar-crop-modal";
import {
  DEFAULT_AVATARS,
  cropImageToSquareDataUrl,
  dataUrlToBlob,
} from "@/lib/avatar";
import { friendlyError } from "@/lib/ui/friendly-error";
import { useTranslations } from "@/i18n/provider";

type Props = {
  open: boolean;
  currentAvatarUrl: string | null;
  onClose: () => void;
  onSaved: (avatarUrl: string) => void;
};

export function AvatarPickerModal({
  open,
  currentAvatarUrl,
  onClose,
  onSaved,
}: Props) {
  const { t } = useTranslations("profile");
  const { t: tc } = useTranslations("common");
  const { t: te } = useTranslations("errors");
  const fileRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<string | null>(currentAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(currentAvatarUrl);
      setError(null);
      setSaving(false);
    }
  }, [open, currentAvatarUrl]);

  useEffect(() => {
    return () => {
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current);
        cropObjectUrlRef.current = null;
      }
    };
  }, []);

  if (!open) return null;

  function revokeCropUrl() {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = null;
    }
  }

  async function persistAvatarUrl(avatarUrl: string) {
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (avatarUrl.startsWith("data:image/")) {
        const blob = dataUrlToBlob(avatarUrl);
        const form = new FormData();
        form.append("file", blob, "avatar.jpg");
        res = await fetch("/api/account/avatar", {
          method: "PATCH",
          body: form,
        });
      } else {
        res = await fetch("/api/account/avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl }),
        });
      }
      const data = (await res.json().catch(() => ({}))) as {
        avatarUrl?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || data.error || "SAVE_FAILED");
      }
      const next = data.avatarUrl ?? avatarUrl;
      onSaved(next);
      onClose();
    } catch (e) {
      const { message } = friendlyError(e, t("saveError"), te);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("invalidFileType"));
      return;
    }
    try {
      const { needsCrop, objectUrl, img } = await prepareUploadForCrop(file);
      revokeCropUrl();
      cropObjectUrlRef.current = objectUrl;

      if (needsCrop) {
        setCropSrc(objectUrl);
        setCropOpen(true);
      } else {
        const dataUrl = cropImageToSquareDataUrl(img, 1);
        setSelected(dataUrl);
      }
    } catch {
      setError(t("imageLoadError"));
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
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
          aria-labelledby="avatar-picker-title"
          className="relative z-10 flex max-h-[min(92vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-wewin-border px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2
                id="avatar-picker-title"
                className="text-base font-bold text-zinc-900 sm:text-lg"
              >
                {t("pickTitle")}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 break-words">
                {t("pickHint")}
              </p>
            </div>
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

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
              {DEFAULT_AVATARS.map((av) => {
                const active = selected === av.src;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelected(av.src)}
                    disabled={saving}
                    className={`aspect-square overflow-hidden rounded-full ring-2 transition ${
                      active
                        ? "ring-wewin-navy ring-offset-2"
                        : "ring-transparent hover:ring-wewin-navy/30"
                    }`}
                    aria-label={t(`defaults.${av.labelKey}`)}
                    aria-pressed={active}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={av.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                void onPickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-wewin-navy/40 bg-wewin-bg px-3 py-3 text-sm font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg disabled:opacity-50"
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{t("upload")}</span>
            </button>

            {selected?.startsWith("data:") ? (
              <div className="mt-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-wewin-navy/20"
                />
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-center text-sm text-red-600 break-words">
                {error}
              </p>
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
              disabled={!selected || saving}
              onClick={() => {
                if (selected) void persistAvatarUrl(selected);
              }}
              className="rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-50"
            >
              {saving ? t("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>

      {cropSrc ? (
        <AvatarCropModal
          open={cropOpen}
          imageSrc={cropSrc}
          saving={saving}
          onClose={() => {
            setCropOpen(false);
            revokeCropUrl();
            setCropSrc(null);
          }}
          onSave={(dataUrl) => {
            setCropOpen(false);
            revokeCropUrl();
            setCropSrc(null);
            setSelected(dataUrl);
          }}
        />
      ) : null}
    </>
  );
}
