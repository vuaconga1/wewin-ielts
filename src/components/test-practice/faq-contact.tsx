"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  Phone,
  MapPin,
  Mail,
  Globe,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Tôi nên bắt đầu luyện thi IELTS từ đâu nếu chưa có nền tảng vững?",
    answer:
      "Bạn nên bắt đầu bằng việc làm bài kiểm tra trình độ ngắn trên hệ thống để xác định mức điểm hiện tại. Sau đó, hãy tập trung vào phần 'Học 4 kỹ năng' với các công cụ như Chép chính tả (Dictation) để rèn phản xạ nghe bắt từ, và Shadowing để chỉnh phát âm chuẩn trước khi bước vào luyện các bộ đề dài.",
  },
  {
    question: "Giao diện và đề thi trên Wewin có giống thi thật trên máy tính (Computer-delivered) không?",
    answer:
      "Có! Hệ thống mô phỏng 100% định dạng thi IELTS trên máy tính chính thức của IDP và British Council: chia màn hình song song giữa đề bài và câu hỏi, đồng hồ bấm giờ đếm ngược, tô màu câu đã làm/chưa làm và tự động chấm điểm ngay khi nộp bài.",
  },
  {
    question: "Phương pháp Shadowing trên hệ thống giúp cải thiện Speaking như thế nào?",
    answer:
      "Shadowing là kỹ thuật nhại lại giọng người bản ngữ ngay khi nghe. Hệ thống cung cấp các audio chuẩn với các tùy chỉnh tốc độ linh hoạt (0.75x - 1.25x), giúp bạn luyện ngữ điệu, trọng âm, nối âm và sự trôi chảy tự nhiên, khắc phục triệt để thói quen dịch từng từ trong đầu.",
  },
  {
    question: "Tôi có thể làm lại đề thi bao nhiêu lần và hệ thống có lưu lịch sử không?",
    answer:
      "Bạn có thể làm lại bài thi không giới hạn số lần. Mọi kết quả, điểm số, thời gian làm bài và chi tiết câu đúng/sai đều được lưu lại trong mục 'Lịch sử làm bài' để bạn và thầy cô dễ dàng theo dõi sự tiến bộ qua từng ngày.",
  },
  {
    question: "Làm thế nào để đăng ký học các lớp tương tác trực tiếp với giáo viên Wewin qua Zoom?",
    answer:
      "Học viên của Wewin sẽ được cấp tài khoản để truy cập mục 'Lớp học của tôi' (`/classroom`), tham gia phòng Zoom trực tiếp cùng thầy cô, nhận tài liệu học và nộp bài tập về nhà. Để đăng ký lớp học mới hoặc gia hạn tài khoản, bạn có thể liên hệ trực tiếp với trung tâm qua Hotline hoặc các cơ sở bên dưới.",
  },
];

export function FaqContact() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="space-y-12">
      {/* FAQ Section */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
            <span>CÂU HỎI THƯỜNG GẶP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Giải Đáp Thắc Mắc Luyện Thi IELTS
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-zinc-900 hover:text-wewin-navy transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${
                      isOpen ? "rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA & Contact Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-wewin-navy to-[#183168] text-white p-6 sm:p-10 shadow-xl border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>ĐỒNG HÀNH CÙNG WEWIN EDUCATION</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Sẵn Sàng Bứt Phá Điểm Số IELTS Cùng Wewin?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
              Bắt đầu luyện tập ngay hôm nay với kho đề thi thử miễn phí, hoặc liên hệ ngay với đội ngũ chuyên môn Wewin để được kiểm tra đầu vào và tư vấn lộ trình học phù hợp nhất.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <span>Bắt đầu thi thử ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#site-footer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs sm:text-sm transition-all"
              >
                <span>Thông tin liên hệ & Cơ sở</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3.5 text-xs">
            <div className="font-bold text-sm text-amber-300 pb-1 border-b border-white/10">
              Hệ Thống Trung Tâm WeWIN Education
            </div>

            <div className="space-y-2 text-zinc-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cơ sở 1:</strong> 292B Nơ Trang Long, P.12, Q. Bình Thạnh, TP.HCM
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cơ sở 2:</strong> 742 Xô Viết Nghệ Tĩnh, P.25, Q. Bình Thạnh, TP.HCM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Hotline:</strong> 0345 969 388 / 037 866 9388
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>officemanager@wewin.edu.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <span>wewin.edu.vn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

