"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
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
import {
  peekSessionMe,
  subscribeSessionMe,
  type SessionMe,
} from "@/lib/client/session-me";

const EMPTY: SessionMe = { user: null, canImport: false };

function sessionSnapshot(): SessionMe {
  return peekSessionMe() ?? EMPTY;
}

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const session = useSyncExternalStore(
    subscribeSessionMe,
    sessionSnapshot,
    () => EMPTY,
  );
  const user = session.user;

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
          <Link
            href="/"
            className="rounded-full px-3.5 py-1.5 transition text-[#001233] hover:text-[#001233] hover:bg-zinc-100/80 font-bold"
          >
            Về WeWIN
          </Link>
          <Link
            href="/tests"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            Kiểm tra trình độ
          </Link>
          <Link
            href="/learn"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            Học 4 kỹ năng
          </Link>
          <Link
            href="/tests"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            Luyện thi
          </Link>
          <a
            href="#achievers-hall-of-fame"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80 flex items-center gap-1.5 text-amber-700"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Bảng vàng</span>
          </a>
          <a
            href="#support-form-section"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80"
          >
            Tư vấn & Hỗ trợ
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
              <span className="hidden sm:inline">Vào Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login?next=/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#001233] bg-white px-4 py-1.5 text-xs md:text-sm font-bold text-[#001233] hover:bg-[#001233] hover:text-white transition-all shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-2 top-20 z-50 rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 lg:hidden animate-in fade-in slide-in-from-top-4">
          <nav className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[#001233] font-bold bg-blue-50/60"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              Về WeWIN Education
            </Link>
            <Link
              href="/tests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <GraduationCap className="h-4 w-4 text-zinc-500" />
              Kiểm tra trình độ miễn phí
            </Link>
            <Link
              href="/learn"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <BookOpen className="h-4 w-4 text-zinc-500" />
              Học & Luyện 4 kỹ năng
            </Link>
            <Link
              href="/tests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <Sparkles className="h-4 w-4 text-zinc-500" />
              Kho đề thi thử Cambridge & Real Exam
            </Link>
            <a
              href="#achievers-hall-of-fame"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100 text-amber-700 font-semibold"
            >
              <Trophy className="h-4 w-4 text-amber-500 fill-amber-400" />
              Bảng vàng vinh danh học viên
            </a>
            <a
              href="#support-form-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <Phone className="h-4 w-4 text-zinc-500" />
              Đăng ký tư vấn lộ trình
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
