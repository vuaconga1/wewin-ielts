"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Camera,
  Clock,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
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
      <div className="flex flex-col items-center text-center">
        {/* Avatar Frame with black ring */}
        <div className="relative mb-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-wewin-accent-blue-bg text-lg font-bold text-wewin-navy ring-2 ring-black shadow-xs">
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
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-wewin-navy text-white shadow-sm ring-2 ring-white hover:bg-wewin-navy-hover active:scale-95 transition-all"
            aria-label={t("changeAvatar")}
            title={t("changeAvatar")}
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Display Name */}
        <p className="max-w-full truncate text-sm font-extrabold text-slate-900 tracking-tight" title={displayName}>
          {displayName}
        </p>

        {/* Role Badge */}
        <div className="mt-1 flex items-center justify-center">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              user.role === "ADMIN"
                ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                : user.role === "TEACHER"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                : user.role === "STUDENT"
                ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {user.role === "ADMIN" && <ShieldCheck className="h-3 w-3 text-purple-600" />}
            {user.role === "TEACHER" && <GraduationCap className="h-3 w-3 text-indigo-600" />}
            {user.role === "STUDENT" && <Sparkles className="h-3 w-3 text-blue-600" />}
            <span>
              {user.role === "ADMIN"
                ? tc("admin", "Admin")
                : user.role === "TEACHER"
                ? (locale === "en" ? "Teacher" : "Giáo viên")
                : user.role === "VISITOR"
                ? tc("visitor", "Khách")
                : tc("student", "Học viên")}
            </span>
          </span>
        </div>

        {/* Account Validity Card (Thời hạn sử dụng còn lại) */}
        {isUnlimited ? (
          <div className="mt-3 w-full rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-2.5 text-center shadow-2xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>{locale === "en" ? "Account validity" : "Thời hạn tài khoản"}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200/80">
                <span>♾️</span>
                <span>{locale === "en" ? "Lifetime" : "Vĩnh viễn"}</span>
              </span>
            </div>
            <p className="mt-1 text-left text-[11px] text-slate-500 font-medium">
              {locale === "en" ? "Unlimited access to all features" : "Không giới hạn thời gian học tập"}
            </p>
          </div>
        ) : (
          <div
            className={`mt-3 w-full rounded-2xl border p-2.5 shadow-2xs transition-all ${
              isExpired
                ? "border-rose-200/90 bg-rose-50/60"
                : diffMs <= 7 * 86_400_000
                ? "border-amber-200/90 bg-amber-50/60"
                : "border-indigo-100/90 bg-indigo-50/40"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock
                  className={`h-3.5 w-3.5 ${
                    isExpired
                      ? "text-rose-500"
                      : diffMs <= 7 * 86_400_000
                      ? "text-amber-500"
                      : "text-indigo-600"
                  }`}
                />
                <span>{locale === "en" ? "Remaining time" : "Thời hạn còn lại"}</span>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                  isExpired
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : diffMs <= 7 * 86_400_000
                    ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                    : "bg-indigo-100/80 text-indigo-800 border-indigo-200"
                }`}
              >
                {remainingText}
              </span>
            </div>

            {expiryDateStr && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{locale === "en" ? "Expires on:" : "Hạn dùng:"}</span>
                <span className="font-semibold text-slate-700">{expiryDateStr}</span>
              </div>
            )}

            <div className="mt-1.5 border-t border-slate-200/60 pt-1 text-center">
              <Link
                href="/#site-footer"
                onClick={handleContactClick}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                {isExpired
                  ? (locale === "en" ? "Renew account now →" : "Gia hạn tài khoản ngay →")
                  : (locale === "en" ? "Extend account" : "Liên hệ để gia hạn")}
              </Link>
            </div>
          </div>
        )}

        {/* Rank & Points Card */}
        <div className="mt-2.5 w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-center shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shadow-2xs">
                <Trophy className="h-3.5 w-3.5" />
              </span>
              <div className="text-left min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {rank.loading
                    ? t("rankLoading")
                    : rank.rank != null
                    ? t("rankLabel", { rank: rank.rank })
                    : t("unranked")}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {rank.loading
                    ? "…"
                    : t("pointsLabel", {
                        points: formatPoints(rank.points, numberLocale),
                      })}
                </p>
              </div>
            </div>
            {rank.rank != null && (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                TOP {rank.rank}
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutPending}
            className="group inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>
              {logoutPending
                ? (locale === "en" ? "Logging out..." : "Đang đăng xuất...")
                : tn("logout", "Đăng xuất")}
            </span>
          </button>
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
