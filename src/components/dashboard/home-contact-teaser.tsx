"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

export function HomeContactTeaser() {
  const { t } = useTranslations("home");

  return (
    <section className="wewin-card-3d p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-wewin-navy" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-800">
          {t("contactTeaserTitle", "Liên hệ WEWIN")}
        </h2>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        {t(
          "contactTeaserDesc",
          "Hai cơ sở tại Bình Thạnh · Hotline & email hỗ trợ học viên.",
        )}
      </p>
      <a
        href="#site-footer"
        className="mt-3 inline-block text-xs font-semibold text-wewin-navy hover:underline"
      >
        {t("contactTeaserLink", "Xem thông tin liên hệ >")}
      </a>
      <p className="mt-2 text-xs text-zinc-400">
        <Link href="https://wewin.edu.vn" target="_blank" rel="noopener noreferrer" className="hover:underline">
          wewin.edu.vn
        </Link>
      </p>
    </section>
  );
}
