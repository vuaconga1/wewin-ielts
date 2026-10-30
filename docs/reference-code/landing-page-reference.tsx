"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Headphones,
  LayoutDashboard,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Mic,
  Phone,
  Quote,
  Send,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";

/**
 * ============================================================================
 * LANDING PAGE FULL REFERENCE TEMPLATE
 * ============================================================================
 * Bao gồm đầy đủ:
 * 1. LandingHeader (Thanh điều hướng cố định + Mobile menu)
 * 2. HeroSection (Banner chính với Gradient, Badge, CTA & Mascot)
 * 3. StorySection (Vấn đề học viên & 3 yếu tố cá nhân hoá)
 * 4. AdaptiveSection (Card xanh đậm sang trọng giới thiệu phương pháp học)
 * 5. ExpertSection (So sánh Chuyên gia & Công nghệ AI)
 * 6. MissionSection (Marquee chữ chạy vô tận + Thẻ kính Glassmorphism)
 * 7. AchieversSection (Bảng vàng học viên & Các con số thống kê)
 * 8. JourneySection (Banner kêu gọi kiểm tra trình độ)
 * 9. SupportFormSection (Biểu mẫu đăng ký tư vấn + Thông tin liên hệ cơ sở)
 * 10. LandingFooter (Chân trang đa cột hiện đại)
 * ============================================================================
 */

// CẤU HÌNH THÔNG TIN THƯƠNG HIỆU & HÌNH ẢNH (THAY ĐỔI THEO DỰ ÁN CỦA BẠN)
const BRAND_CONFIG = {
  brandName: "WeWIN Education",
  logoSrc: "/brand/wewin-logo.png",
  mascotSrc: "/branding/wewin-mascot-hero.png",
  honorBannerSrc: "/branding/wewin-achievers-honor.jpg",
  hotlines: ["0345 969 388", "037 866 9388"],
  email: "contact@yourdomain.edu.vn",
  addressList: [
    "Cơ sở 1: 292B Nơ Trang Long, P.12, Q. Bình Thạnh, TP.HCM",
    "Cơ sở 2: 742 Xô Viết Nghệ Tĩnh, P.25, Q. Bình Thạnh, TP.HCM",
  ],
  workingHours: "Thứ 2 - Thứ 7: 8h00 - 21h00 | Chủ nhật: 8h00 - 17h30",
};

/* =========================================================================
   1. HEADER & NAVIGATION
   ========================================================================= */
export function LandingHeaderReference({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-2 pt-2 md:pt-4 transition-all">
      <div className="w-full max-w-[1254px] flex items-center justify-between py-3 px-4 lg:px-6 z-50 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-b-3xl shadow-[0px_4px_24px_0px_rgba(2,48,114,0.08)] border border-slate-100">
        {/* Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-black text-xl tracking-tight text-[#001233]">
              {BRAND_CONFIG.brandName}
            </span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-semibold text-zinc-700">
          <Link href="/" className="rounded-full px-3.5 py-1.5 transition text-[#001233] hover:bg-zinc-100/80 font-bold">
            Trang chủ
          </Link>
          <Link href="/tests" className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80">
            Kiểm tra trình độ
          </Link>
          <Link href="/learn" className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80">
            Khóa học 4 kỹ năng
          </Link>
          <a
            href="#achievers-hall-of-fame"
            className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80 flex items-center gap-1.5 text-amber-700"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Bảng vàng</span>
          </a>
          <a href="#support-form-section" className="rounded-full px-3.5 py-1.5 transition hover:text-[#001233] hover:bg-zinc-100/80">
            Tư vấn & Hỗ trợ
          </a>
        </nav>

        {/* CTA / Auth Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#001233] px-4 py-2 text-xs md:text-sm font-bold text-white shadow hover:bg-[#092257] transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Vào Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#001233] bg-white px-4 py-1.5 text-xs md:text-sm font-bold text-[#001233] hover:bg-[#001233] hover:text-white transition-all shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-2 top-20 z-50 rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 lg:hidden">
          <nav className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[#001233] font-bold bg-blue-50/60"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              Trang chủ
            </Link>
            <Link
              href="/tests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <Award className="h-4 w-4 text-zinc-500" />
              Kiểm tra trình độ miễn phí
            </Link>
            <a
              href="#achievers-hall-of-fame"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100 text-amber-700 font-semibold"
            >
              <Trophy className="h-4 w-4 text-amber-500 fill-amber-400" />
              Bảng vàng vinh danh
            </a>
            <a
              href="#support-form-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-zinc-100"
            >
              <Phone className="h-4 w-4 text-zinc-500" />
              Đăng ký tư vấn
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* =========================================================================
   2. HERO SECTION
   ========================================================================= */
function HeroSection() {
  return (
    <section
      id="hero-section"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#A6BAFF] via-[#d6dff9] to-white pt-28 sm:pt-36 lg:pt-40 pb-16"
    >
      <div className="mx-auto flex w-full max-w-[1366px] flex-col items-start gap-8 px-6 lg:min-h-[580px] lg:flex-row lg:items-center lg:px-20">
        <div className="max-w-[620px] lg:max-w-[540px] mx-auto lg:mx-0 z-10 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-[#001233] border border-[#001233]/10 shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Nền tảng Học & Luyện thi Thông minh
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-[46px]/[56px] font-extrabold text-[#001233] tracking-tight">
            Nền tảng Học và Luyện thi
            <span className="mt-2 block bg-gradient-to-r from-[#f0b136] to-[#f06036] bg-clip-text text-transparent">
              thực chiến 4 kỹ năng
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-700 leading-relaxed font-normal">
            Kho đề thi cập nhật liên tục, chấm điểm tức thì, giao diện thi chuẩn quốc tế cùng bộ công cụ Chép chính tả và Shadowing độc quyền.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-full bg-[#001233] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-[#001233]/25 hover:bg-[#00205b] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Bắt đầu học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#001233] bg-white px-7 py-3 text-sm sm:text-base font-bold text-[#001233] hover:bg-zinc-50 transition-all shadow-sm"
            >
              <span>Thi thử miễn phí</span>
            </Link>
          </div>
        </div>

        {/* Hero Mascot / Hình minh họa */}
        <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[480px] lg:ml-auto z-10 flex justify-center">
          <div className="absolute inset-x-8 bottom-4 h-12 rounded-full bg-[#001233]/15 blur-2xl" />
          <Image
            src={BRAND_CONFIG.mascotSrc}
            alt="Hero Mascot"
            width={600}
            height={500}
            priority
            className="relative h-auto w-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   3. STORY / PROBLEM SECTION
   ========================================================================= */
function StorySection() {
  return (
    <section className="px-4 pt-16 pb-12 relative overflow-hidden lg:px-10 lg:pt-24 xl:px-20 bg-white">
      <div className="mx-auto max-w-[1206px] text-center relative z-10">
        <p className="text-xl text-zinc-600 lg:text-2xl max-w-3xl mx-auto leading-relaxed">
          Cùng một bài giảng, cùng một giáo trình, cùng một lớp học
          <br />
          <span className="font-bold text-[#001233]">
            Tại sao có những người nhanh chóng đạt mục tiêu nhưng cũng có người vẫn mãi loay hoay?
          </span>
        </p>

        <div className="mx-auto mt-8 max-w-[920px] rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-amber-50/50 border border-slate-200/80 p-6 sm:p-8 shadow-sm relative text-center">
          <Quote className="w-8 h-8 text-blue-300 absolute -top-4 left-6" />
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#001233] leading-snug">
            “Mỗi người đều có điểm xuất phát, điểm mạnh, điểm yếu và tốc độ học tập khác nhau.”
          </p>
          <Quote className="w-8 h-8 text-amber-300 absolute -bottom-4 right-6 rotate-180" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1206px] mx-auto text-left mt-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-lg mb-4">
              01
            </div>
            <h3 className="text-lg font-bold text-[#001233] mb-2">Điểm xuất phát</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Mỗi học viên có nền tảng từ vựng, ngữ pháp ban đầu không giống nhau. Lộ trình cần bắt đầu chính xác từ nơi bạn đang đứng.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-black text-lg mb-4">
              02
            </div>
            <h3 className="text-lg font-bold text-[#001233] mb-2">Điểm mạnh & Điểm yếu</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Có bạn nghe tốt nhưng từ vựng yếu, có bạn đọc nhanh nhưng phát âm chưa chuẩn. Cần tập trung thời gian cải thiện đúng điểm nghẽn.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-lg mb-4">
              03
            </div>
            <h3 className="text-lg font-bold text-[#001233] mb-2">Tốc độ học tập</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Khả năng tiếp thu, ghi nhớ và thời gian biểu của mỗi người hoàn toàn khác biệt. Hệ thống điều chỉnh nhịp độ tối ưu nhất cho bạn.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   4. ADAPTIVE LEARNING SECTION
   ========================================================================= */
function AdaptiveSection() {
  return (
    <section className="px-4 py-12 lg:px-20 lg:py-16 bg-slate-50/60">
      <div className="mx-auto max-w-[1254px] rounded-[36px] bg-gradient-to-br from-[#001233] via-[#092257] to-[#001233] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-[#f0b136]">
            <Sparkles className="w-4 h-4" />
            Phương pháp tiếp cận vượt trội
          </span>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Nền tảng Học tập Cá nhân hóa{" "}
            <span className="bg-gradient-to-r from-[#f0b136] to-[#f06036] bg-clip-text text-transparent">
              Adaptive Learning
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Thay vì áp dụng một lộ trình cứng nhắc cho tất cả, hệ thống tự động chẩn đoán điểm mạnh - điểm yếu và liên tục tinh chỉnh bài tập để bạn tiến bộ nhanh nhất.
          </p>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-white text-base">Chẩn đoán thông minh</h4>
              <p className="text-xs text-slate-300 mt-1">Xác định chính xác lỗ hổng từ vựng và ngữ pháp.</p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10">
              <Target className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="font-bold text-white text-base">Cá nhân hóa bài tập</h4>
              <p className="text-xs text-slate-300 mt-1">Nội dung tự điều chỉnh theo tốc độ làm bài thực tế.</p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10">
              <Award className="w-6 h-6 text-blue-400 mb-2" />
              <h4 className="font-bold text-white text-base">Tối ưu hóa thời gian</h4>
              <p className="text-xs text-slate-300 mt-1">Rút ngắn thời gian ôn luyện mà vẫn đạt kết quả cao.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   5. EXPERT & TECHNOLOGY SECTION
   ========================================================================= */
function ExpertSection() {
  return (
    <section className="px-4 py-16 lg:px-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-[1254px]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full inline-block">
            Chất lượng chuyên môn & Công nghệ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001233] leading-tight">
            Ứng dụng công nghệ để nhân bản tư duy của những bậc thầy xuất sắc nhất
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Cột 1: Chuyên môn */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 sm:p-10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="inline-flex p-3 rounded-2xl bg-[#001233] text-white mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#001233] mb-4">
                Đội ngũ Chuyên gia kiến tạo chuẩn mực
              </h3>
              <ul className="space-y-3.5 text-zinc-700 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Giáo trình & bộ tiêu chí chấm điểm chuẩn khảo thí quốc tế.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Phân tích chi tiết từng lỗi sai và hướng dẫn phương pháp khắc phục.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Chiến thuật giải đề tinh gọn, tiết kiệm thời gian làm bài.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200">
              <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-bold text-[#001233] hover:text-blue-600">
                <span>Khám phá chương trình học</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Cột 2: Công nghệ */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 sm:p-10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#001233] mb-4">
                Công nghệ tương tác học tập hiện đại
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs flex items-center gap-2.5">
                  <BookOpenCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">Chấm điểm tự động</span>
                </div>
                <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">Lộ trình thích ứng</span>
                </div>
                <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs flex items-center gap-2.5">
                  <Headphones className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">Luyện nghe Dictation</span>
                </div>
                <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs flex items-center gap-2.5">
                  <Mic className="w-5 h-5 text-purple-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">Luyện phát âm Shadowing</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200">
              <Link href="/tests" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800">
                <span>Trải nghiệm kho đề thi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   6. MISSION SECTION (INFINITE MARQUEE)
   ========================================================================= */
function MissionSection() {
  return (
    <section className="bg-slate-50 relative py-20 lg:py-28 overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .reference-marquee {
          display: flex;
          width: max-content;
          animation: marquee-scroll 35s linear infinite;
        }
        .reference-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Marquee ticker nền */}
      <div className="relative w-full overflow-hidden select-none opacity-30">
        <div className="reference-marquee flex items-center gap-12">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-10 shrink-0">
              <span className="whitespace-nowrap text-6xl sm:text-8xl lg:text-[100px] leading-none font-black tracking-wider uppercase text-blue-900/20">
                OUR MISSION
              </span>
              <Star className="w-8 h-8 text-blue-400 fill-blue-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Thẻ Glassmorphic chính */}
      <div className="mx-auto max-w-[1216px] px-4 mt-8 relative z-10">
        <div className="rounded-2xl border-4 border-white bg-white/80 backdrop-blur-md p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:max-w-[430px]">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#001233] leading-snug">
              Chinh phục mục tiêu không là đặc quyền của riêng ai
            </h2>
          </div>
          <div className="w-full h-px lg:w-px lg:h-36 bg-slate-300" />
          <p className="flex-1 text-base sm:text-xl lg:text-2xl text-zinc-700 leading-relaxed">
            Sứ mệnh của chúng tôi là ứng dụng <span className="font-bold text-[#001233]">Công nghệ & Phương pháp thực chiến</span> để xóa nhòa rào cản. Giúp bạn tiếp cận giáo dục chất lượng cao mọi lúc, mọi nơi với chi phí hợp lý nhất.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   7. ACHIEVERS HALL OF FAME SECTION
   ========================================================================= */
function AchieversSection() {
  return (
    <section id="achievers-hall-of-fame" className="px-4 py-16 lg:px-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-[1254px]">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs sm:text-sm border border-amber-200">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            Bảng Vàng Thành Tích
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001233] leading-tight">
            Vinh danh học viên đạt điểm cao
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
            Hàng ngàn học viên đã bứt phá giới hạn và đạt được chứng chỉ mong ước cùng chúng tôi.
          </p>
        </div>

        {/* Số liệu ấn tượng */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">8.5 IELTS</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Band điểm cao nhất</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">98%</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Đạt và vượt mục tiêu</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">10.000+</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Học viên tin cậy</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">100%</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Đề thi máy chuẩn quốc tế</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   8. SUPPORT FORM & CONTACT SECTION
   ========================================================================= */
function SupportFormSection() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseInterest, setCourseInterest] = useState("khoa_hoc");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName || !phone) return;
    // Gửi dữ liệu tới API tư vấn hoặc webhook tại đây
    setSubmitted(true);
  }

  return (
    <section id="support-form-section" className="py-16 md:py-24 bg-white scroll-mt-20">
      <div className="mx-auto w-full max-w-[1366px] px-6 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start justify-between">
          {/* Cột trái: Form đăng ký */}
          <div className="w-full lg:max-w-[720px]">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#001233] leading-tight">
              Bạn cần tư vấn lộ trình học?
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Vui lòng để lại thông tin, đội ngũ chuyên viên sẽ liên hệ và tư vấn chi tiết hoàn toàn miễn phí.
            </p>

            {submitted ? (
              <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 sm:p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-xl font-bold text-emerald-900">Đăng ký thành công!</h4>
                <p className="text-sm text-emerald-700">
                  Cảm ơn bạn {fullName}! Chuyên viên sẽ liên hệ qua số {phone} trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      Nhu cầu quan tâm
                    </label>
                    <div className="relative">
                      <select
                        value={courseInterest}
                        onChange={(e) => setCourseInterest(e.target.value)}
                        className="w-full h-12 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                      >
                        <option value="khoa_hoc">Khóa học 4 kỹ năng</option>
                        <option value="luyen_thi">Luyện đề thi thử</option>
                        <option value="kiem_tra">Kiểm tra trình độ đầu vào</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                    Mục tiêu hoặc ghi chú thêm
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mục tiêu band điểm, thời gian dự kiến thi..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#001233] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-blue-900 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Đăng ký tư vấn ngay</span>
                </button>
              </form>
            )}
          </div>

          {/* Cột phải: Thông tin liên hệ */}
          <div className="w-full lg:max-w-[420px] rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-lg text-[#001233] mb-4">Thông tin liên hệ</h4>
              <div className="space-y-4 text-sm text-zinc-700">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-900">Hotline:</p>
                    <p>{BRAND_CONFIG.hotlines.join(" - ")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-900">Email:</p>
                    <p>{BRAND_CONFIG.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-900">Cơ sở đào tạo:</p>
                    {BRAND_CONFIG.addressList.map((addr, idx) => (
                      <p key={idx} className="mt-0.5">• {addr}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-zinc-500">
              Giờ làm việc: {BRAND_CONFIG.workingHours}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   9. FOOTER
   ========================================================================= */
function LandingFooter() {
  return (
    <footer className="bg-[#001233] text-white rounded-t-[48px] overflow-hidden">
      <div className="max-w-[1366px] mx-auto px-6 md:px-20 py-12 md:py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16 lg:items-start">
          <div className="flex-1 flex flex-col gap-4 max-w-md">
            <span className="font-black text-2xl tracking-tight text-white">
              {BRAND_CONFIG.brandName}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">
              Nền tảng đào tạo & luyện thi trực tuyến toàn diện, ứng dụng công nghệ Adaptive Learning để tối ưu hóa năng lực học tập của từng học viên.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1">
            <div className="space-y-3">
              <h5 className="font-bold text-sm tracking-wider uppercase text-amber-400">Khám phá</h5>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/" className="hover:text-white transition">Trang chủ</Link></li>
                <li><Link href="/tests" className="hover:text-white transition">Kiểm tra trình độ</Link></li>
                <li><Link href="/learn" className="hover:text-white transition">Khóa học</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-sm tracking-wider uppercase text-amber-400">Tính năng</h5>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/learn" className="hover:text-white transition">Chép chính tả</Link></li>
                <li><Link href="/learn" className="hover:text-white transition">Luyện nói Shadowing</Link></li>
                <li><a href="#achievers-hall-of-fame" className="hover:text-white transition">Bảng vàng</a></li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h5 className="font-bold text-sm tracking-wider uppercase text-amber-400">Liên hệ</h5>
              <p className="text-sm text-slate-300">Hotline: {BRAND_CONFIG.hotlines[0]}</p>
              <p className="text-sm text-slate-300">Email: {BRAND_CONFIG.email}</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {BRAND_CONFIG.brandName}. Bản quyền được bảo lưu.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================================
   MAIN EXPORT COMPONENT
   ========================================================================= */
export default function LandingPageReference() {
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-blue-600 selection:text-white">
      <LandingHeaderReference />
      <main className="flex-1 w-full overflow-x-hidden">
        <HeroSection />
        <StorySection />
        <AdaptiveSection />
        <ExpertSection />
        <MissionSection />
        <AchieversSection />
        <SupportFormSection />
      </main>
      <LandingFooter />
    </div>
  );
}
