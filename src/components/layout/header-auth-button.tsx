"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  loggedIn: boolean;
  className?: string;
};

const chromeBtn =
  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/70 sm:px-2";

export function HeaderAuthButton({ loggedIn, className = "" }: Props) {
  const { t } = useTranslations("auth");
  const { t: tn } = useTranslations("nav");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!loggedIn) {
    const label = t("login", "Đăng nhập");
    return (
      <Link
        href="/login"
        className={`${chromeBtn} ${className}`}
        aria-label={label}
        title={label}
      >
        <LogIn
          className="h-5 w-5 shrink-0 text-wewin-gold"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="w-full text-center text-[10px] font-medium leading-tight text-white sm:text-[11px]">
          {label}
        </span>
      </Link>
    );
  }

  const label = tn("logout", "Đăng xuất");

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
      disabled={pending}
      onClick={onLogout}
      className={`${chromeBtn} disabled:opacity-50 ${className}`}
      aria-label={label}
      title={label}
    >
      <LogOut
        className="h-5 w-5 shrink-0 text-wewin-gold"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="w-full text-center text-[10px] font-medium leading-tight text-white sm:text-[11px]">
        {label}
      </span>
    </button>
  );
}
