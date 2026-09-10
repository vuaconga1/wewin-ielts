"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  className?: string;
};

export function LogoutButton({
  className = "text-xs text-zinc-500 hover:text-wewin-navy disabled:opacity-50",
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { t } = useTranslations("nav");

  async function onLogout() {
    setPending(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className={className}
    >
      {t("logout")}
    </button>
  );
}
