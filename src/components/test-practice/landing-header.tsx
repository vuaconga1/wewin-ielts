"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Gamepad2,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Menu,
  Phone,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslations } from "@/i18n/provider";
import {
  peekSessionMe,
  subscribeSessionMe,
  type SessionMe,
} from "@/lib/client/session-me";

const EMPTY: SessionMe = { user: null, canImport: false };

function sessionSnapshot(): SessionMe {
  return peekSessionMe() ?? EMPTY;
}

const WEWIN_ECOSYSTEM_LINKS = [
  {
    title: "Về WeWIN",
    subtitle: "Website chính thức wewin.edu.vn",
    href: "https://wewin.edu.vn",
    icon: Globe,
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    title: "Ôn luyện Cambridge",
    subtitle: "Starters • Movers • Flyers • KET",
    href: "https://exam.wewin.edu.vn",
    icon: GraduationCap,
    iconBg: "bg-sky-50 text-sky-600",
  },
  {
    title: "Ôn luyện VSTEP",
    subtitle: "Luyện thi VSTEP B1 • B2 • C1",
    href: "https://vstep.wewin.edu.vn",
    icon: Trophy,
    iconBg: "bg-rose-50 text-rose-600",
  },
  {
    title: "Chơi Games",
    subtitle: "E-Learning Global Success 1 đến 9",
    href: "https://elearning.wewin.edu.vn",
    icon: Gamepad2,
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    title: "Học Tiếng Hoa",
    subtitle: "HSK 1–9 & Tiếng Trung giao tiếp",
    href: "https://chinese.wewin.edu.vn",
    iconType: "hanzi" as const,
    iconBg: "bg-emerald-50 text-emerald-700",
  },
];

export function LandingHeader() {
  const { t } = useTranslations("landingHeader");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const session = useSyncExternalStore(
    subscribeSessionMe,
    sessionSnapshot,
    () => EMPTY,
  );
  const user = session.user;

  const ecosystemLinks = [
    {
      title: t("about", "Về WeWIN"),
      subtitle: t("aboutDesc", "Hệ sinh thái giáo dục WEWIN"),
      href: "https://wewin.edu.vn",
      icon: Globe,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: t("cambridgeTitle", "Ôn luyện Cambridge"),
      subtitle: t("cambridgeSub", "Starters • Movers • Flyers • KET"),
      href: "https://exam.wewin.edu.vn",
      icon: GraduationCap,
      iconBg: "bg-sky-50 text-sky-600",
    },
    {
      title: t("vstepTitle", "Ôn luyện VSTEP"),
      subtitle: t("vstepSub", "Luyện thi VSTEP B1 • B2 • C1"),
      href: "https://vstep.wewin.edu.vn",
      icon: Trophy,
      iconBg: "bg-rose-50 text-rose-600",
    },
    {
      title: t("gamesTitle", "Chơi Games"),
      subtitle: t("gamesSub", "E-Learning Global Success 1 đến 9"),
      href: "https://elearning.wewin.edu.vn",
      icon: Gamepad2,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: t("chineseTitle", "Học Tiếng Hoa"),
      subtitle: t("chineseSub", "HSK 1–9 & Tiếng Trung giao tiếp"),
      href: "https://chinese.wewin.edu.vn",
      iconType: "hanzi" as const,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ];

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-2 pt-2 md:pt-4 transition-all">
      <div className="w-full max-w-[1254px] flex items-center justify-between py-3 px-4 lg:px-6 z-50 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-b-3xl shadow-[0px_4px_24px_0px_rgba(2,48,114,0.08)] border border-slate-100">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/brand/wewin-logo.png"
              alt="WeWIN Education"
              width={132}
              height={38}
              priority
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-semibold text-zinc-700">
          {/* Ecosystem Dropdown (Về WeWIN) */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              className={`group inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 transition font-bold select-none ${
                dropdownOpen
                  ? "bg-zinc-100 text-[#001233]"
                  : "text-[#001233] hover:text-[#001233] hover:bg-zinc-100/80"
              }`}
            >
              <span>{t("about", "Về WeWIN")}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${
                  dropdownOpen
                    ? "rotate-180 text-blue-900"
                    : "group-hover:text-blue-900"
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 pt-2 z-50">
                <div className="w-[320px] rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                      {t("aboutDesc", "HỆ SINH THÁI WEWIN")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {ecosystemLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          rel="noreferrer"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${item.iconBg}`}
                            >
                              {item.iconType === "hanzi" ? (
                                <span className="font-serif font-black text-xs leading-none select-none">
                                  汉
                                </span>
                              ) : Icon ? (
                                <Icon className="h-4 w-4" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-zinc-900 group-hover:text-blue-950">
                                {item.title}
                              </p>
                              <p className="truncate text-[11px] text-zinc-500">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/tests"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            {t("placementTest", "Kiểm tra trình độ")}
          </Link>
          <Link
            href="/learn"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            {t("learn4Skills", "Học 4 kỹ năng")}
          </Link>
          <Link
            href="/tests"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            {t("practiceTests", "Luyện thi")}
          </Link>
          <a
            href="#achievers-hall-of-fame"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80 flex items-center gap-1.5 text-amber-700"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{t("hallOfFame", "Bảng vàng")}</span>
          </a>
          <a
            href="#support-form-section"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            {t("support", "Tư vấn & Hỗ trợ")}
          </a>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSwitcher />

          {user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin/classes" : "/dashboard"}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#001233] px-4 py-2 text-xs md:text-sm font-bold text-white shadow hover:bg-[#092257] transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t("toDashboard", "Vào Dashboard")}</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login?next=/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#001233] bg-white px-4 py-1.5 text-xs md:text-sm font-bold text-[#001233] hover:bg-[#001233] hover:text-white transition-all shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>{t("login", "Đăng nhập")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-2 top-20 z-50 rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 lg:hidden animate-in fade-in slide-in-from-top-4 max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            {/* Ecosystem Collapsible Section */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-2">
              <button
                type="button"
                onClick={() => setMobileSubmenuOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-bold text-[#001233]"
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>{t("about", "Về WeWIN")}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-500 transition-transform ${
                    mobileSubmenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileSubmenuOpen && (
                <div className="mt-2 flex flex-col gap-1 border-t border-blue-100/80 pt-2 pl-1">
                  {ecosystemLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        rel="noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-2.5 rounded-lg p-2 text-xs font-semibold text-zinc-800 hover:bg-white"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${item.iconBg}`}
                          >
                            {item.iconType === "hanzi" ? (
                              <span className="font-serif font-black text-[11px] leading-none">
                                汉
                              </span>
                            ) : Icon ? (
                              <Icon className="h-3.5 w-3.5" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-zinc-900">
                              {item.title}
                            </p>
                            <p className="truncate text-[10px] text-zinc-500">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/tests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <GraduationCap className="h-4 w-4 text-zinc-500" />
              {t("placementTest", "Kiểm tra trình độ")}
            </Link>
            <Link
              href="/learn"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <BookOpen className="h-4 w-4 text-zinc-500" />
              {t("learn4Skills", "Học 4 kỹ năng")}
            </Link>
            <Link
              href="/tests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <Sparkles className="h-4 w-4 text-zinc-500" />
              {t("practiceTests", "Luyện thi")}
            </Link>
            <a
              href="#achievers-hall-of-fame"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100 text-amber-700 font-semibold"
            >
              <Trophy className="h-4 w-4 text-amber-500 fill-amber-400" />
              {t("hallOfFame", "Bảng vàng")}
            </a>
            <a
              href="#support-form-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <Phone className="h-4 w-4 text-zinc-500" />
              {t("support", "Tư vấn & Hỗ trợ")}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
