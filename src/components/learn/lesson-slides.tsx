"use client";

import { useTranslations } from "@/i18n/provider";

type Props = {
  src: string;
  title: string;
};

export function LessonSlides({ src, title }: Props) {
  const { t } = useTranslations("learn");
  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900 shadow-sm">
      <div className="relative aspect-video w-full">
        <iframe
          src={src}
          title={t("slidesFrameTitle", { title }, "Slide bài giảng: {title}")}
          className="absolute inset-0 h-full w-full border-0"
          allow="fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
