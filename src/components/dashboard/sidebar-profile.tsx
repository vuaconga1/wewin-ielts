"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, LogOut, Trophy, User } from "lucide-react";
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
  initials: string;
  role: string;
  avatarUrl: string | null;
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

  if (compact) {
    return (
      <>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-wewin-accent-blue-bg text-xs font-bold text-wewin-navy ring-2 ring-wewin-navy/10 hover:ring-wewin-navy/25"
            aria-label={t("changeAvatar")}
            title={user.username}
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

        <p className="max-w-full truncate text-sm font-bold text-wewin-navy">
          {user.username}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {user.role === "ADMIN" ? tc("admin") : tc("student")}
        </p>

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
