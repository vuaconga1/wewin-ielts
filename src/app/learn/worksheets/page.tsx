import React from "react";
import Link from "next/link";
import { getWorksheetsCatalog } from "@/lib/learn/worksheets-store";
import { SiteShell } from "@/components/layout/site-shell";
import { BookOpen, Layers, CheckCircle2, ChevronRight, FileSpreadsheet } from "lucide-react";

export const metadata = {
  title: "Thư viện Bài tập Ngữ pháp Toàn diện (Worksheets) | WeWIN IELTS",
  description: "Hệ thống 60 bài tập ngữ pháp tiếng Anh từ cơ bản đến nâng cao theo giáo trình WeWIN.",
};

export default async function WorksheetsCatalogPage() {
  const worksheets = await getWorksheetsCatalog();

  const totalQuestions = worksheets.reduce((acc, w) => acc + w.questionCount, 0);

  return (
    <SiteShell active="learn">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover p-8 sm:p-10 text-white shadow-xl border border-white/10 mb-10">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-wewin-gold/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-wewin-accent-blue/20 blur-3xl" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wewin-gold/15 border border-wewin-gold/30 text-wewin-gold-soft text-xs font-semibold backdrop-blur-md mb-3">
              <FileSpreadsheet className="w-3.5 h-3.5 text-wewin-gold" /> Bộ giáo trình 60 Worksheets WeWIN
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Thư viện Bài tập{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-wewin-gold-soft via-amber-200 to-white">
                Ngữ pháp Toàn diện
              </span>
            </h1>
            <p className="mt-3 text-zinc-200 text-sm sm:text-base leading-relaxed">
              Luyện tập ngữ pháp tiếng Anh từ nền tảng A1/A2 đến B1/B2/IELTS Foundation với hệ thống bài tập tương tác, chấm điểm tức thì và giải thích chi tiết.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-zinc-200">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-wewin-gold" />
                <span>{worksheets.length} bài học</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-wewin-gold" />
                <span>{totalQuestions} câu hỏi thực hành</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Chấm điểm thông minh tự động</span>
              </div>
            </div>
          </div>
        </div>

        {/* Worksheets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {worksheets.map((ws) => (
            <Link
              key={ws.id}
              href={`/learn/worksheets/${ws.slug}`}
              className="group card-outline-hover p-5 flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-wewin-navy bg-wewin-accent-blue-bg border border-wewin-accent-blue/20 px-2.5 py-1 rounded-md transition-colors group-hover:bg-wewin-navy group-hover:text-white group-hover:border-wewin-navy">
                    {ws.title}
                  </span>
                  <span className="text-xs font-semibold text-[#7a5f12] bg-wewin-gold/15 border border-wewin-gold/30 px-2 py-0.5 rounded">
                    Cấp độ {ws.level}
                  </span>
                </div>

                <h3 className="font-bold text-wewin-navy text-base group-hover:text-wewin-accent-blue transition-colors line-clamp-2 break-words">
                  {ws.subject}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                  {ws.subjectVi}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-wewin-border flex items-center justify-between text-xs text-zinc-500">
                <span>
                  <strong className="text-wewin-navy">{ws.sectionCount}</strong> phần ({ws.questionCount} câu)
                </span>
                <span className="font-semibold text-wewin-accent-blue flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Làm bài <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
