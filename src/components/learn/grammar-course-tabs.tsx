import Link from "next/link";
import { Lock } from "lucide-react";
import { BuyCourseButton } from "@/components/learn/buy-course-button";
import { formatVnd } from "@/lib/learn/course-pricing";

type LockedProps = {
  title: string;
  description: string;
  cta?: { href: string; label: string };
  purchase?: { courseTitle: string; priceVnd: number; priceLabel: string };
};

export function GrammarCourseLocked({ title, description, cta, purchase }: LockedProps) {
  return (
    <div className="card-outline px-6 py-14 text-center">
      <Lock className="mx-auto h-10 w-10 text-zinc-400" />
      <h2 className="mt-4 break-words text-lg font-bold text-zinc-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md break-words text-sm text-zinc-600">{description}</p>
      {purchase ? (
        <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="break-words text-sm font-semibold text-wewin-navy">{purchase.courseTitle}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{purchase.priceLabel}</p>
          <p className="text-2xl font-extrabold tabular-nums text-red-600">{formatVnd(purchase.priceVnd)}</p>
        </div>
      ) : null}
      {cta || purchase ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {purchase ? (
            <BuyCourseButton
              courseTitle={purchase.courseTitle}
              priceVnd={purchase.priceVnd}
              className="inline-flex items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
            />
          ) : null}
          {cta ? (
            <Link
              href={cta.href}
              className={
                purchase
                  ? "inline-flex rounded-xl border border-wewin-navy/20 bg-white px-4 py-2.5 text-sm font-semibold text-wewin-navy hover:bg-slate-50"
                  : "inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
              }
            >
              {cta.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
