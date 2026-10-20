"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

export function PageLoadingIndicator() {
  const { t } = useTranslations("common");
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-wewin-navy" aria-hidden />
      <span className="text-sm font-medium text-zinc-600">{t("loading", "Đang tải…")}</span>
    </div>
  );
}
