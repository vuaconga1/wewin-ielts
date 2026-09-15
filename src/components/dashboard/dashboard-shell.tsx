"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  GraduationCap,
  Home,
  Menu,
  Trophy,
  Upload,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  SidebarProfile,
  type SidebarUser,
} from "@/components/dashboard/sidebar-profile";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { HeaderAuthButton } from "@/components/layout/header-auth-button";
import { TourButton } from "@/components/tour/tour-button";
import { TourProvider } from "@/components/tour/tour-provider";
import { useTranslations } from "@/i18n/provider";
import { tourUserKey } from "@/lib/tour/storage";
import type { TourStep } from "@/lib/tour/types";

export type DashboardNavKey =
  | "home"
  | "learn"
  | "tests"
  | "ranking"
  | "attempts"
  | "import"
  | "admin-learn"
  | "admin-attempts"
  | "admin-users"
  | "login";

type UserChip = SidebarUser | null;

type Props = {
  children: React.ReactNode;
  active?: DashboardNavKey;
  user: UserChip;
  canImport: boolean;
  /** Uncapped content width (lesson player); default is max-w-[1400px] */
  wide?: boolean;
  /** Server-rendered site footer (SiteShell); omitted on focused practice UIs */
  footer?: React.ReactNode;
};

const SIDEBAR_COLLAPSED_KEY = "wewin_sidebar_collapsed";

function navClass(active: boolean, compact: boolean) {
  if (compact) {
    return `flex items-center justify-center rounded-full p-2.5 text-sm font-medium transition ${
      active
        ? "bg-wewin-navy text-white"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    }`;
  }
  return `flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition ${
    active
      ? "bg-wewin-navy text-white"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
  }`;
}

export function DashboardShell({
  children,
  active,
  user,
  canImport,
  wide = false,
  footer,
}: Props) {
  const pathname = usePathname();
  /** Full-page campus photo + frost — login only; elsewhere solid wewin-bg */
  const showCampusBackground = pathname === "/login";
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "1" || stored === "true") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const prepareTourStep = useCallback((step: TourStep | null) => {
    if (!step) {
      setOpen(false);
      return;
    }
    if (step.sidebar) {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setOpen(true);
      } else {
        setCollapsed(false);
      }
    } else {
      setOpen(false);
    }
  }, []);

  const NAV = [
    { key: "home" as const, href: "/", label: t("nav.home"), icon: Home },
    {
      key: "learn" as const,
      href: "/learn",
      label: t("nav.learn"),
      icon: GraduationCap,
    },
    {
      key: "tests" as const,
      href: "/tests",
      label: t("nav.tests"),
      icon: BookOpen,
    },
    {
      key: "ranking" as const,
      href: "/ranking",
      label: t("nav.ranking"),
      icon: Trophy,
    },
    {
      key: "attempts" as const,
      href: "/account/attempts",
      label: t("nav.attempts"),
      icon: ChartLine,
      authOnly: true,
    },
  ];

  function renderSidebar(compact: boolean) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {user ? (
          <div
            data-tour="home-profile"
            className={`mb-5 border-b border-wewin-border pb-4 ${
              compact ? "px-0" : ""
            }`}
          >
            <SidebarProfile
              user={user}
              loginActive={active === "login"}
              onNavigate={() => setOpen(false)}
              compact={compact}
            />
          </div>
        ) : (
          <div
            data-tour="home-profile"
            className={`mb-5 border-b border-wewin-border pb-4 ${
              compact ? "flex justify-center" : ""
            }`}
          >
            <SidebarProfile
              user={null}
              loginActive={active === "login"}
              onNavigate={() => setOpen(false)}
              compact={compact}
            />
          </div>
        )}

        <nav data-tour="nav" className="flex flex-1 flex-col gap-1">
          {NAV.filter((item) => !item.authOnly || user).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className={navClass(active === item.key, compact)}
                title={compact ? item.label : undefined}
                aria-label={compact ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!compact ? (
                  <span className="min-w-0 break-words">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
          {/* Admin links: canImport is true only for ADMIN (or guest + ALLOW_OPEN_ADMIN). Never for STUDENT. */}
          {canImport && user?.role !== "STUDENT" ? (
            <>
              {(
                [
                  {
                    key: "admin-users" as const,
                    href: "/admin/users",
                    label: t("nav.adminUsers"),
                    icon: UserCog,
                  },
                  {
                    key: "admin-attempts" as const,
                    href: "/admin/attempts",
                    label: t("nav.adminAttempts"),
                    icon: Users,
                  },
                  {
                    key: "admin-learn" as const,
                    href: "/admin/learn",
                    label: t("nav.adminLearn"),
                    icon: Clapperboard,
                  },
                  {
                    key: "import" as const,
                    href: "/admin/import",
                    label: t("nav.import"),
                    icon: Upload,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={navClass(active === item.key, compact)}
                    title={compact ? item.label : undefined}
                    aria-label={compact ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!compact ? (
                      <span className="min-w-0 break-words">{item.label}</span>
                    ) : null}
                  </Link>
                );
              })}
            </>
          ) : null}
        </nav>
      </div>
    );
  }

  return (
    <TourProvider
      userKey={tourUserKey(user?.username)}
      onPrepareStep={prepareTourStep}
    >
      <div
        className={`relative min-h-screen overflow-x-hidden ${
          showCampusBackground ? "" : "bg-wewin-bg"
        }`}
      >
        {showCampusBackground ? (
          <div className="wewin-campus-scene" aria-hidden="true">
            <div className="wewin-campus-scene__photo" />
            <div className="wewin-campus-scene__frost" />
          </div>
        ) : null}

        <header className="wewin-site-header fixed inset-x-0 top-0 z-[108] flex min-w-0 items-center bg-wewin-navy text-white">
          <div className="flex h-full min-w-0 shrink-0 items-center gap-1 border-white/15 px-2 sm:gap-1.5 sm:px-3 lg:w-[var(--wewin-sidebar-width)] lg:justify-center lg:border-r lg:px-4">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-md p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/70 lg:hidden"
              aria-label={t("nav.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="flex min-w-0 items-center justify-center"
              onClick={() => setOpen(false)}
              aria-label={t("common.brand", "WEWIN Education")}
            >
              <Image
                src="/brand/wewin-logo.png"
                alt={t("common.brand", "WEWIN Education")}
                width={168}
                height={44}
                sizes="(max-width: 640px) 132px, 168px"
                className="h-8 w-auto max-w-[min(168px,46vw)] object-contain object-center sm:h-9"
                priority
              />
            </Link>
          </div>

          <div className="min-w-0 flex-1" aria-hidden="true" />

          <div className="mr-2 flex shrink-0 items-center gap-0.5 rounded-xl bg-white/[0.06] px-1 py-0.5 sm:mr-3 sm:gap-1 sm:px-1.5 lg:mr-5">
            <TourButton variant="chrome" />
            <LanguageSwitcher variant="chrome" className="shrink-0" />
            <HeaderAuthButton loggedIn={Boolean(user)} />
          </div>
        </header>

        <aside
          className={`wewin-sidebar-rail fixed bottom-0 left-0 z-30 hidden border-r border-wewin-border bg-wewin-white py-5 lg:block ${
            collapsed ? "px-2" : "px-4"
          }`}
          data-collapsed={collapsed ? "true" : "false"}
        >
          <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto">
            {renderSidebar(collapsed)}
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute top-1/2 -right-3 z-40 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-wewin-border bg-wewin-white text-wewin-navy shadow-sm transition hover:bg-wewin-navy hover:text-white hover:border-wewin-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-navy/40"
            aria-label={
              collapsed
                ? t("sidebar.expand", "Mở rộng thanh bên")
                : t("sidebar.collapse", "Thu gọn thanh bên")
            }
            aria-expanded={!collapsed}
            title={
              collapsed
                ? t("sidebar.expand", "Mở rộng thanh bên")
                : t("sidebar.collapse", "Thu gọn thanh bên")
            }
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label={t("nav.closeMenu")}
              className="absolute inset-0 bg-zinc-900/40"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(var(--wewin-sidebar-width),88vw)] flex-col overflow-y-auto border-r border-wewin-border bg-wewin-white px-4 py-5 shadow-xl">
              <button
                type="button"
                className="mb-3 ml-auto flex rounded-lg border border-wewin-border p-1.5 text-zinc-500 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
              {renderSidebar(false)}
            </aside>
          </div>
        ) : null}

        <div
          className="wewin-sidebar-inset relative z-10 flex min-h-screen min-w-0 flex-col"
          data-collapsed={collapsed ? "true" : "false"}
        >
          <main
            className={`mx-auto w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${
              wide ? "max-w-none" : "max-w-[1400px]"
            }`}
          >
            {children}
          </main>
          {footer ? <div className="mt-auto w-full shrink-0">{footer}</div> : null}
        </div>
      </div>
    </TourProvider>
  );
}
