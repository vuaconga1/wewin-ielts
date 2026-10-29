"use client";

import Link from "next/link";
import { BookOpen, Layers, ArrowRight, Sparkles, Check, Clock, Award } from "lucide-react";

interface TestCategory {
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  stats: string;
  skills: string[];
  link: string;
  highlightColor: string;
  popular?: boolean;
}

const TEST_SERIES: TestCategory[] = [
  {
    title: "Cambridge IELTS Series (Vol 10 – 19)",
    badge: "Chuẩn Quốc Tế",
    subtitle: "Bộ đề kinh điển từ Nhà xuất bản Cambridge",
    description:
      "Nguồn tài liệu luyện thi bắt buộc cho mọi sĩ tử IELTS. Giao diện làm bài được thiết kế chuẩn từng giây với kỳ thi máy tính thực tế, hỗ trợ nghe chất lượng cao và xem transcript sau khi nộp.",
    stats: "40+ Tests đầy đủ 4 kỹ năng",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    link: "/tests",
    highlightColor: "from-blue-600 to-indigo-700",
    popular: true,
  },
  {
    title: "Real IELTS Exam (Vol 1 – 5)",
    badge: "Xu Hướng Mới Nhất",
    subtitle: "Bộ đề thi thật được cập nhật liên tục",
    description:
      "Tổng hợp các đề thi thực tế đã xuất hiện trong các kỳ thi IELTS chính thức gần đây. Giúp học viên nắm bắt các chủ đề nóng và làm quen với các bẫy đề thi hiện đại.",
    stats: "25+ Bộ đề thi thật",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    link: "/tests",
    highlightColor: "from-amber-500 to-orange-600",
    popular: false,
  },
  {
    title: "Placement & Skill Mastery Tests",
    badge: "Định Vị Band Điểm",
    subtitle: "Test nhanh trình độ & luyện theo kỹ năng",
    description:
      "Dành cho học viên mới bắt đầu hoặc muốn tập trung cải thiện riêng từng kỹ năng yếu. Tự động đánh giá trình độ hiện tại và gợi ý lộ trình học tập phù hợp nhất.",
    stats: "Test nhanh 20 - 45 phút",
    skills: ["Listening", "Reading", "Shadowing", "Dictation"],
    link: "/learn",
    highlightColor: "from-emerald-600 to-teal-700",
    popular: false,
  },
];

export function TestSeriesShowcase() {
  return (
    <section id="test-series" className="scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>KHO ĐỀ THỰC CHIẾN ĐA DẠNG</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Bộ Đề Thi Thử Bám Sát Mọi Xu Hướng
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-zinc-600 max-w-2xl">
            Tất cả các bộ đề đều hỗ trợ chế độ Luyện tập (xem đáp án và giải thích ngay) và Thi thử (bấm giờ tính điểm như phòng thi thật).
          </p>
        </div>

        <Link
          href="/tests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-wewin-navy hover:text-blue-600 self-start md:self-auto shrink-0"
        >
          <span>Xem tất cả danh mục đề</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEST_SERIES.map((series, idx) => (
          <div
            key={idx}
            className={`relative rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              series.popular ? "border-amber-300 ring-2 ring-amber-400/20" : "border-zinc-200"
            }`}
          >
            {series.popular && (
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold shadow-sm">
                Được luyện tập nhiều nhất
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  {series.badge}
                </span>
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {series.stats}
                </span>
              </div>

              <h3 className="text-lg font-bold text-zinc-900 leading-snug mb-1">
                {series.title}
              </h3>
              <p className="text-xs font-medium text-amber-700 mb-3">{series.subtitle}</p>

              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
                {series.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {series.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={series.link}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all text-white shadow-sm bg-gradient-to-r ${series.highlightColor} hover:opacity-95`}
            >
              <span>Vào luyện đề ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

