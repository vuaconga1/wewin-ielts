"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Clock, LogOut, Trophy, User } from "lucide-react";
import { AvatarPickerModal } from "@/components/dashboard/avatar-picker-modal";
import { LogoutButton } from "@/components/dashboard/logout-button";
import {
  clearMyRankCache,
  fetchMyRank,
} from "@/lib/client/ranking-me";
import { clearSessionMe } from "@/lib/client/session-me";
import { formatPoints } from "@/lib/ranking-shared";
import { useTranslations } from "@/i18n/provider";

export type SidebarUser = {
  username: string;
  /** Display name under avatar; falls back to username when null. */
  fullName: string | null;
  initials: string;
  role: string;
  avatarUrl: string | null;
  accessPlan?: "FREE" | "PAID" | "UNLIMITED";
  accessExpiresAt?: string | null;
  accessStatus?: "ACTIVE" | "EXPIRING" | "EXPIRED" | "UNLIMITED";
};

type Props = {
  user: SidebarUser | null;
  loginActive?: boolean;
  onNavigate?: () => void;
  /** Icon-only rail (desktop collapsed sidebar) */
  compact?: boolean;
};

type RankState = {
  rank: number | null;
  points: number;
  loading: boolean;
};

export function SidebarProfile({
  user,
  loginActive,
  onNavigate,
  compact = false,
}: Props) {
  const { t } = useTranslations("profile");
  const { t: tn } = useTranslations("nav");
  const { t: tc } = useTranslations("common");
  const { locale } = useTranslations();
  const router = useRouter();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl ?? null,
  );
  const [rank, setRank] = useState<RankState>({
    rank: null,
    points: 0,
    loading: Boolean(user),
  });
  const [logoutPending, setLogoutPending] = useState(false);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (!user) {
      clearMyRankCache();
      setRank({ rank: null, points: 0, loading: false });
      return;
    }
    // Compact rail does not show rank — skip network (desktop + mobile still share cache).
    if (compact) {
      setRank((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;
    setRank((prev) => ({ ...prev, loading: true }));

    fetchMyRank(user.username)
      .then((data) => {
        if (cancelled) return;
        setRank({
          rank: data.rank,
          points: data.points,
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setRank({ rank: null, points: 0, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [user?.username, compact]);

  async function onLogout() {
    setLogoutPending(true);
    try {
      clearMyRankCache();
      clearSessionMe();
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/");
      router.refresh();
    } finally {
      setLogoutPending(false);
    }
  }

  if (!user) {
    if (compact) {
      return (
        <Link
          href="/login"
          onClick={onNavigate}
          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full transition ${
            loginActive
              ? "bg-wewin-navy text-white"
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
          }`}
          aria-label={tn("loginRegister")}
          title={tn("loginRegister")}
        >
          <User className="h-4 w-4" />
        </Link>
      );
    }

    return (
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
          <User className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{tc("guest")}</p>
          <p className="text-xs text-zinc-500">{tn("notLoggedIn")}</p>
          <Link
            href="/login"
            onClick={onNavigate}
            className={`text-xs font-medium hover:underline ${
              loginActive ? "text-wewin-accent-blue" : "text-wewin-navy"
            }`}
          >
            {tn("loginRegister")}
          </Link>
        </div>
      </div>
    );
  }

  const numberLocale = locale === "en" ? "en-US" : "vi-VN";

  const displayName = user.fullName?.trim() || user.username;

  // Kiểm tra tài khoản có thời hạn vĩnh viễn không
  const isUnlimited =
    user.accessPlan === "UNLIMITED" ||
    user.accessStatus === "UNLIMITED" ||
    user.role === "ADMIN" ||
    user.role === "TEACHER" ||
    (!user.accessExpiresAt && user.accessPlan !== "FREE" && user.accessPlan !== "PAID");

  const now = Date.now();
  const expiresAtMs = user.accessExpiresAt ? Date.parse(user.accessExpiresAt) : null;
  const isExpired = user.accessStatus === "EXPIRED" || (expiresAtMs != null && expiresAtMs <= now);
  const diffMs = expiresAtMs != null ? expiresAtMs - now : 0;

  let remainingText = "Đã hết hạn";
  if (!isExpired && diffMs > 0) {
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (days > 1) {
      remainingText = `Còn ${days} ngày`;
    } else if (hours > 1) {
      remainingText = `Còn ${hours} giờ`;
    } else {
      remainingText = "Còn dưới 1 giờ";
    }
  }

  let expiryDateStr: string | null = null;
  if (expiresAtMs != null && !Number.isNaN(expiresAtMs)) {
    try {
      expiryDateStr = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(expiresAtMs));
    } catch {
      expiryDateStr = null;
    }
  }

  function handleContactClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const footer = document.getElementById("site-footer");
    if (footer) {
      e.preventDefault();
      footer.scrollIntoView({ behavior: "smooth" });
    }
  }

  if (compact) {
    return (
      <>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-wewin-accent-blue-bg text-xs font-bold text-wewin-navy ring-2 ring-wewin-navy/10 hover:ring-wewin-navy/25"
            aria-label={t("changeAvatar")}
            title={displayName}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{user.initials}</span>
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutPending}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-wewin-navy disabled:opacity-50"
            aria-label={tn("logout")}
            title={tn("logout")}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

        <AvatarPickerModal
          open={pickerOpen}
          currentAvatarUrl={avatarUrl}
          onClose={() => setPickerOpen(false)}
          onSaved={(next) => {
            setAvatarUrl(next);
            router.refresh();
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center px-1 text-center">
        <div className="relative mb-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-wewin-accent-blue-bg text-lg font-bold text-wewin-navy ring-2 ring-wewin-navy/10">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{user.initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-wewin-navy text-white shadow-sm ring-2 ring-white hover:bg-wewin-navy-hover"
            aria-label={t("changeAvatar")}
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="max-w-full truncate text-sm font-bold text-wewin-navy" title={displayName}>
          {displayName}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {user.role === "ADMIN"
            ? tc("admin")
            : user.role === "TEACHER"
              ? locale === "en" ? "Teacher" : "Giáo viên"
              : user.role === "VISITOR"
                ? tc("visitor", "Khách")
                : tc("student")}
        </p>

        {!isUnlimited ? (
          <div className="mt-2.5 w-full rounded-xl border border-wewin-border bg-white px-3 py-2 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <Clock
                className={`h-3.5 w-3.5 shrink-0 ${
                  isExpired
                    ? "text-red-500"
                    : diffMs <= 7 * 86_400_000
                      ? "text-amber-500"
                      : "text-emerald-600"
                }`}
                aria-hidden
              />
              <span className="text-zinc-600">Thời hạn còn lại:</span>
              <span
                className={`font-semibold ${
                  isExpired
                    ? "text-red-600"
                    : diffMs <= 7 * 86_400_000
                      ? "text-amber-600"
                      : "text-emerald-700"
                }`}
              >
                {remainingText}
              </span>
            </div>
            {expiryDateStr ? (
              <p className="mt-0.5 text-[11px] text-zinc-400">
                (Hạn dùng: {expiryDateStr})
              </p>
            ) : null}
            <div className="mt-1.5 border-t border-zinc-100 pt-1.5">
              <Link
                href="/#site-footer"
                onClick={handleContactClick}
                className="inline-block text-[11px] text-zinc-400 underline hover:text-zinc-600 transition-colors"
              >
                liên hệ Wewin để gia hạn
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-3 w-full rounded-xl border border-wewin-border bg-zinc-50 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="min-w-0 truncate text-sm font-bold text-wewin-navy">
              {rank.loading
                ? t("rankLoading")
                : rank.rank != null
                  ? t("rankLabel", { rank: rank.rank })
                  : t("unranked")}
            </p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {rank.loading
              ? "…"
              : t("pointsLabel", {
                  points: formatPoints(rank.points, numberLocale),
                })}
          </p>
        </div>

        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>

      <AvatarPickerModal
        open={pickerOpen}
        currentAvatarUrl={avatarUrl}
        onClose={() => setPickerOpen(false)}
        onSaved={(next) => {
          setAvatarUrl(next);
          router.refresh();
        }}
      />
    </>
  );
}
