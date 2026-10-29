"use client";

import Link from "next/link";
import { Target, Mic, BookOpen, Award, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Định Vị Band Điểm",
    icon: Target,
    desc: "Làm bài test nhanh hoặc chọn 1 đề thi thử để hệ thống đánh giá band điểm hiện tại và xác định kỹ năng cần cải thiện.",
    action: "Test thử ngay",
    link: "/tests",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    step: "02",
    title: "Luyện Bổ Trợ Kỹ Năng",
    icon: Mic,
    desc: "Sử dụng công cụ Chép chính tả Dictation và Shadowing phát âm nhại giọng để bứt phá phản xạ Nghe - Nói tự nhiên.",
    action: "Học kỹ năng",
    link: "/learn",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    step: "03",
    title: "Luyện Đề Bấm Giờ",
    icon: BookOpen,
    desc: "Thực chiến với kho đề Cambridge & Real Exam dưới áp lực thời gian phòng thi máy để hoàn thiện kỹ năng kiểm soát thời gian.",
    action: "Kho đề thi",
    link: "/tests",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    step: "04",
    title: "Phân Tích & Bứt Phá",
    icon: Award,
    desc: "Xem lại phân tích lỗi sai chi tiết từng câu, tích lũy điểm trên Bảng xếp hạng và tự tin chinh phục mục tiêu 7.0 - 8.5 IELTS.",
    action: "Xem lịch sử",
    link: "/account/attempts",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
];

export function LearningJourney() {
  return (
    <section className="bg-zinc-50 rounded-3xl p-6 sm:p-10 border border-zinc-200/80">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Lộ Trình 4 Bước Chinh Phục IELTS Tại Wewin
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600">
          Phương pháp học tập khoa học, kết hợp giữa rèn luyện kỹ năng cốt lõi và cọ xát với đề thi thật giúp học viên tiến bộ nhanh chóng.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-between relative group hover:border-zinc-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-zinc-300 group-hover:text-amber-500 transition-colors">
                    {s.step}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-bold text-base text-zinc-900 mb-2">{s.title}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed mb-6">{s.desc}</p>
              </div>

              <Link
                href={s.link}
                className="inline-flex items-center gap-1 text-xs font-semibold text-wewin-navy hover:text-amber-600 transition-colors mt-auto"
              >
                <span>{s.action}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

