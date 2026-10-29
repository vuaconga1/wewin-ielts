"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  Trophy,
  BookOpen,
  CheckCircle2,
  Users,
  Target,
  Clock,
} from "lucide-react";

export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-wewin-navy via-[#142852] to-[#0a1530] text-white p-6 sm:p-10 lg:p-14 shadow-xl border border-white/10 mb-12">
      {/* Background glowing blurs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headlines & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>NỀN TẢNG LUYỆN THI IELTS THỰC CHIẾN CHUẨN QUỐC TẾ</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
            Luyện Thi Thực Chiến <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-white">
              4 Kỹ Năng IELTS
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-xl">
            Chấm điểm chuẩn tiêu chí giám khảo • Biết điểm tức thì, sửa lỗi chuyên sâu • Đầy đủ kho đề Cambridge 10-19 & Real Exam mới nhất kèm công cụ Shadowing & Chép chính tả độc quyền.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Bắt đầu làm bài test ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all"
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Học 4 kỹ năng chuyên sâu</span>
            </Link>

            <a
              href="#achievers-hall-of-fame"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-zinc-300 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Bảng vàng học viên</span>
            </a>
          </div>

          {/* Quick bullet guarantees */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-300 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Giao diện mô phỏng 100% thi máy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transcript & Giải thích chi tiết</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dự đoán chuẩn xác Band điểm</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Stats Card & Mascot / Brand */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">100+</div>
              <div className="text-xs font-semibold text-zinc-200 mt-0.5">Đề Thi Thực Chiến</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Cambridge & Real Exam</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center mb-2">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-300">4</div>
              <div className="text-xs font-semibold text-zinc-200 mt-0.5">Kỹ Năng Toàn Diện</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Listening, Reading, Writing, Speaking</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">10,000+</div>
              <div className="text-xs font-semibold text-zinc-200 mt-0.5">Lượt Làm Bài</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Chấm điểm tức thì</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-xl bg-rose-400/20 text-rose-300 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-300">98%</div>
              <div className="text-xs font-semibold text-zinc-200 mt-0.5">Đạt Mục Tiêu</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Từ 6.5 đến 8.5 IELTS</div>
            </div>
          </div>

          {/* Quick jump menu pills */}
          <div className="mt-4 p-3 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-300 font-medium">Khám phá nhanh:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href="#ielts-overview"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cấu trúc IELTS
              </a>
              <a
                href="#features-ecosystem"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Tính năng
              </a>
              <a
                href="#test-series"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Bộ đề thi
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

