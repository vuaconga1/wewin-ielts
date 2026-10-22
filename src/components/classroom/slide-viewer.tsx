"use client";

import type { ClassroomSlide } from "@/lib/classroom/types";

type Props = {
  slide: ClassroomSlide | null;
  title: string;
  emptyLabel: string;
};

export function SlideViewer({ slide, title, emptyLabel }: Props) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-wewin-border bg-white shadow-sm">
      <div className="border-b border-wewin-border px-4 py-3">
        <h2 className="break-words text-sm font-bold text-wewin-navy">{title}</h2>
      </div>
      <div className="flex aspect-video min-h-52 w-full items-center justify-center bg-zinc-950">
        {slide ? (
          // Presentation manifests may point to any approved R2/custom CDN.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.id}
            src={slide.imageUrl}
            alt={slide.alt || title}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="px-6 text-center text-sm text-zinc-300">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
