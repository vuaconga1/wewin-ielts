"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Star,
  Award,
  Sparkles,
  Quote,
  ChevronRight,
  Camera,
  GraduationCap,
} from "lucide-react";
import { ACHIEVERS_DATA, type AchieverProfile } from "@/data/achievers-data";

export function AchieversHallOfFame() {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = ACHIEVERS_DATA.filter((achiever) => {
    const band = parseFloat(String(achiever.overallBand));
    if (filter === "8.0") return band >= 8.0;
    if (filter === "7.5") return band >= 7.5;
    if (filter === "7.0") return band >= 7.0;
    return true;
  });

  return (
    <section id="achievers-hall-of-fame" className="scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>BẢNG VÀNG VINH DANH HỌC VIÊN WEWIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Gương Mặt Bứt Phá Điểm Số IELTS
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-zinc-600 max-w-2xl">
            Tự hào đồng hành cùng hàng nghìn học viên chinh phục mục tiêu từ 6.5 đến 8.5 IELTS với phương pháp thực chiến và hệ thống luyện thi thông minh.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl self-start md:self-auto shrink-0">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "8.0", label: "Band 8.0+" },
            { key: "7.5", label: "Band 7.5+" },
            { key: "7.0", label: "Band 7.0+" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                filter === tab.key
                  ? "bg-white text-zinc-900 shadow-sm font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Achievers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((student) => {
          const initials = student.name
            .split(" ")
            .slice(-2)
            .map((n) => n[0])
            .join("")
            .toUpperCase();

          return (
            <div
              key={student.id}
              className="group relative bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              {/* Top banner / badge */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar / Placeholder Frame */}
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                    {student.avatarUrl ? (
                      <Image
                        src={student.avatarUrl}
                        alt={student.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-amber-900 select-none">
                        <span className="text-base font-bold tracking-wider">{initials}</span>
                        <span className="text-[9px] font-medium text-amber-700/80 -mt-0.5">WeWin</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-zinc-900 text-base leading-snug group-hover:text-amber-600 transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                      {student.roleOrClass}
                    </p>
                    {student.examDate && (
                      <span className="text-[11px] text-zinc-400">
                        Đạt chứng chỉ: {student.examDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Overall Band Badge */}
                <div className="text-right shrink-0">
                  <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                      Overall
                    </span>
                    <span className="text-lg font-black leading-none">{student.overallBand}</span>
                  </div>
                </div>
              </div>

              {/* Sub-badge pill */}
              {student.badge && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {student.badge}
                  </span>
                </div>
              )}

              {/* 4 Skills Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 p-2 bg-zinc-50 rounded-xl border border-zinc-100 text-center mb-4">
                <div className="p-1 rounded bg-white border border-zinc-100">
                  <div className="text-[10px] font-medium text-zinc-500">Listen</div>
                  <div className="text-xs font-bold text-zinc-900">{student.scores.listening}</div>
                </div>
                <div className="p-1 rounded bg-white border border-zinc-100">
                  <div className="text-[10px] font-medium text-zinc-500">Read</div>
                  <div className="text-xs font-bold text-zinc-900">{student.scores.reading}</div>
                </div>
                <div className="p-1 rounded bg-white border border-zinc-100">
                  <div className="text-[10px] font-medium text-zinc-500">Write</div>
                  <div className="text-xs font-bold text-zinc-900">{student.scores.writing}</div>
                </div>
                <div className="p-1 rounded bg-white border border-zinc-100">
                  <div className="text-[10px] font-medium text-zinc-500">Speak</div>
                  <div className="text-xs font-bold text-zinc-900">{student.scores.speaking}</div>
                </div>
              </div>

              {/* Testimonial Quote */}
              <div className="relative mt-auto pt-2">
                <Quote className="w-5 h-5 text-amber-200 absolute -top-1 -left-1 opacity-70" />
                <p className="text-xs leading-relaxed text-zinc-600 italic pl-4">
                  &ldquo;{student.testimonial}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin / Teacher helper box */}
      <div className="mt-8 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Camera className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Khung mẫu học viên:</span> Anh/Chị có thể dễ dàng thay đổi ảnh thật của học viên tại thư mục{" "}
            <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">public/uploads/achievers/</code>{" "}
            và cập nhật điểm số trong file{" "}
            <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">src/data/achievers-data.ts</code>.
          </div>
        </div>
        <Link
          href="/tests"
          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 shrink-0"
        >
          <span>Thi thử để kiểm tra band điểm</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

