"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Phone, ShoppingCart, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { CONTACT, SOCIAL } from "@/lib/contact";
import { formatVnd } from "@/lib/learn/course-pricing";

type Props = {
  courseTitle: string;
  priceVnd: number;
  className?: string;
};

export function BuyCourseButton({ courseTitle, priceVnd, className }: Props) {
  const { t } = useTranslations("purchase");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const channels = [
    {
      key: "facebook",
      href: SOCIAL.facebook,
      external: true,
      title: t("facebook", "Nhắn Facebook"),
      detail: t("facebookDetail", "Fanpage WeWIN Education"),
      badge: <span className="text-base font-bold">f</span>,
      badgeClass: "bg-[#1877F2] text-white",
    },
    {
      key: "hotline1",
      href: `tel:${CONTACT.hotline1Tel}`,
      external: false,
      title: t("hotline1", "Gọi hotline cơ sở 1"),
      detail: `${CONTACT.hotline1} · ${CONTACT.campus1}`,
      badge: <Phone className="h-4 w-4" aria-hidden />,
      badgeClass: "bg-emerald-600 text-white",
    },
    {
      key: "hotline2",
      href: `tel:${CONTACT.hotline2Tel}`,
      external: false,
      title: t("hotline2", "Gọi hotline cơ sở 2"),
      detail: `${CONTACT.hotline2} · ${CONTACT.campus2}`,
      badge: <Phone className="h-4 w-4" aria-hidden />,
      badgeClass: "bg-emerald-600 text-white",
    },
  ];

  const dialog = open ? (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-900/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-course-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 hover:bg-slate-100 hover:text-zinc-700"
          aria-label={t("close", "Đóng")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-wewin-accent-blue">
            {t("eyebrow", "Đăng ký khóa học")}
          </p>
          <h3 id="buy-course-title" className="mt-1 break-words text-lg font-bold text-wewin-navy">
            {courseTitle}
          </h3>
          <p className="mt-1 text-xl font-extrabold text-red-600 tabular-nums">{formatVnd(priceVnd)}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            {t(
              "intro",
              "Chọn kênh bạn muốn liên hệ. WeWIN sẽ hướng dẫn thanh toán và mở khóa học cho tài khoản của bạn.",
            )}
          </p>
        </div>

        <ul className="mt-4 space-y-2">
          {channels.map((c) => (
            <li key={c.key}>
              <a
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-wewin-accent-blue/40 hover:bg-blue-50/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.badgeClass}`}
                >
                  {c.badge}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-zinc-900">{c.title}</span>
                  <span className="block break-words text-[11px] leading-snug text-zinc-500">
                    {c.detail}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-xl bg-wewin-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-wewin-navy-hover"
        }
      >
        <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
        <span>{t("buyNow", "Mua ngay")}</span>
      </button>
      {dialog && typeof document !== "undefined" ? createPortal(dialog, document.body) : null}
    </>
  );
}
