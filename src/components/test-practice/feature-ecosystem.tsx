"use client";

import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Video,
  Trophy,
  ChartLine,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface FeatureCardProps {
  title: string;
  badge: string;
  category: string;
  description: string;
  features: string[];
  link: string;
  buttonLabel: string;
  icon: typeof BookOpen;
  accentColor: {
    bg: string;
    border: string;
    badge: string;
    iconBg: string;
    iconText: string;
    button: string;
  };
}

const WEWIN_FEATURES: FeatureCardProps[] = [
  {
    title: "Kho Đề Thi Thử Thực Chiến",
    badge: "Hot • Chuẩn 100%",
    category: "Luyện Đề / Test Practice",
    description:
      "Kho đề Cambridge IELTS (10-19) và Real IELTS Exam mô phỏng chân thực giao diện thi trên máy tính (Computer-delivered IELTS). Chấm điểm tức thì, xem transcript và giải thích chi tiết.",
    features: [
      "Đầy đủ đề Listening, Reading, Writing, Speaking",
      "Chế độ Luyện tập (có giải thích) & Thi thử (bấm giờ)",
      "Lưu lại bài làm và tự động tính band điểm",
    ],
    link: "/tests",
    buttonLabel: "Vào làm bài test ngay",
    icon: BookOpen,
    accentColor: {
      bg: "bg-blue-50/40",
      border: "border-blue-200/80 hover:border-blue-400",
      badge: "bg-blue-100 text-blue-800",
      iconBg: "bg-blue-500 text-white shadow-blue-500/20",
      iconText: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  },
  {
    title: "Luyện Shadowing & Phát Âm Chuẩn",
    badge: "Độc Quyền Wewin",
    category: "Speaking & Pronunciation",
    description:
      "Phương pháp nhại giọng (Shadowing) theo người bản ngữ giúp tăng phản xạ nói tự nhiên, chuẩn hóa ngữ điệu, nhấn âm và triệt tiêu lỗi phát âm sai.",
    features: [
      "Audio giọng chuẩn bản ngữ đa dạng accent (UK, US, AUS)",
      "Tùy chỉnh tốc độ phát từ 0.75x đến 1.25x",
      "Ghi âm đối chiếu giọng đọc và nhận xét",
    ],
    link: "/learn",
    buttonLabel: "Luyện Shadowing",
    icon: Mic,
    accentColor: {
      bg: "bg-rose-50/40",
      border: "border-rose-200/80 hover:border-rose-400",
      badge: "bg-rose-100 text-rose-800",
      iconBg: "bg-rose-500 text-white shadow-rose-500/20",
      iconText: "text-rose-600",
      button: "bg-rose-600 hover:bg-rose-700 text-white",
    },
  },
  {
    title: "Chép Chính Tả (Dictation) & Nghe Bắt Từ",
    badge: "Tăng Phản Xạ Nhanh",
    category: "Listening Lab",
    description:
      "Công cụ luyện nghe chép chính tả từng câu, điền từ vào chỗ trống và trả lời câu hỏi ngắn. Giúp khắc phục triệt để tình trạng 'nghe kịp nhưng không bắt kịp chữ' hoặc sót âm đuôi.",
    features: [
      "So khớp ký tự và chỉ ra lỗi chính tả tức thì",
      "Luyện tập theo từng phần (Part 1 - Part 4)",
      "Giải thích ngữ cảnh và từ vựng mở rộng",
    ],
    link: "/learn",
    buttonLabel: "Luyện Chép chính tả",
    icon: Headphones,
    accentColor: {
      bg: "bg-emerald-50/40",
      border: "border-emerald-200/80 hover:border-emerald-400",
      badge: "bg-emerald-100 text-emerald-800",
      iconBg: "bg-emerald-500 text-white shadow-emerald-500/20",
      iconText: "text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
  },
  {
    title: "Kho Bài Mẫu Writing & Phân Tích Đề",
    badge: "Band 8.0+",
    category: "Writing & Reading Lab",
    description:
      "Hệ thống bài mẫu Task 1 & Task 2 chuẩn chấm điểm giám khảo, phân tích cấu trúc lập luận mạch lạc, cung cấp cụm từ học thuật Collocations và Idiomatic expressions.",
    features: [
      "Bài mẫu đa dạng cho tất cả các dạng biểu đồ & bài luận",
      "Phân tích lỗi sai logic và ngữ pháp thường gặp",
      "Từ vựng học thuật phân theo chủ đề sát đề thi thật",
    ],
    link: "/learn",
    buttonLabel: "Học Writing & Reading",
    icon: PenTool,
    accentColor: {
      bg: "bg-purple-50/40",
      border: "border-purple-200/80 hover:border-purple-400",
      badge: "bg-purple-100 text-purple-800",
      iconBg: "bg-purple-500 text-white shadow-purple-500/20",
      iconText: "text-purple-600",
      button: "bg-purple-600 hover:bg-purple-700 text-white",
    },
  },
  {
    title: "Lớp Học Trực Tuyến & Tương Tác Zoom",
    badge: "Giáo Viên Chuyên Sâu",
    category: "Live Classroom",
    description:
      "Tham gia các buổi học tương tác 2 chiều với thầy cô Wewin, đồng bộ bài giảng, nộp bài tập về nhà và nhận giải đáp trực tiếp theo từng chuyên đề.",
    features: [
      "Tích hợp phòng học Zoom không giới hạn",
      "Quản lý bài tập về nhà và nhận xét từ giáo viên",
      "Kho tài liệu học tập lớp học được lưu trữ tập trung",
    ],
    link: "/classroom",
    buttonLabel: "Vào lớp học của tôi",
    icon: Video,
    accentColor: {
      bg: "bg-amber-50/40",
      border: "border-amber-200/80 hover:border-amber-400",
      badge: "bg-amber-100 text-amber-800",
      iconBg: "bg-amber-500 text-white shadow-amber-500/20",
      iconText: "text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
  },
  {
    title: "Bảng Xếp Hạng & Duy Trì Chuỗi Streak",
    badge: "Động Lực Mỗi Ngày",
    category: "Leaderboard & Gamification",
    description:
      "Thi đua học tập cùng cộng đồng sĩ tử Wewin, tích lũy điểm năng nổ qua từng bài thi và duy trì chuỗi ngày học kiên trì để xây dựng kỷ luật vững vàng.",
    features: [
      "Bảng vàng học viên chăm chỉ theo tuần và tháng",
      "Tính điểm tự động dựa trên độ khó và tần suất làm bài",
      "Theo dõi chuỗi ngày Streak giữ lửa học tập",
    ],
    link: "/ranking",
    buttonLabel: "Xem Bảng xếp hạng",
    icon: Trophy,
    accentColor: {
      bg: "bg-orange-50/40",
      border: "border-orange-200/80 hover:border-orange-400",
      badge: "bg-orange-100 text-orange-800",
      iconBg: "bg-orange-500 text-white shadow-orange-500/20",
      iconText: "text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
  },
  {
    title: "Báo Cáo Năng Lực & Lịch Sử Làm Bài",
    badge: "Phân Tích Chi Tiết",
    category: "Analytics & History",
    description:
      "Theo dõi tiến độ học tập toàn diện: xem lại từng bài test đã hoàn thành, số câu đúng/sai, thời gian làm bài thực tế và tỷ lệ chính xác theo từng kỹ năng.",
    features: [
      "Lưu trữ toàn bộ kết quả và đường link xem lại chi tiết",
      "Thống kê tổng số đề đã hoàn thành và điểm số cao nhất",
      "Định vị chính xác kỹ năng cần bổ sung ôn luyện",
    ],
    link: "/account/attempts",
    buttonLabel: "Xem lịch sử làm bài",
    icon: ChartLine,
    accentColor: {
      bg: "bg-cyan-50/40",
      border: "border-cyan-200/80 hover:border-cyan-400",
      badge: "bg-cyan-100 text-cyan-800",
      iconBg: "bg-cyan-500 text-white shadow-cyan-500/20",
      iconText: "text-cyan-600",
      button: "bg-cyan-600 hover:bg-cyan-700 text-white",
    },
  },
];

export function FeatureEcosystem() {
  return (
    <section id="features-ecosystem" className="scroll-mt-20">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>HỆ SINH THÁI TÍNH NĂNG TOÀN DIỆN</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
          Các Công Cụ Học & Luyện Thi Tại Wewin
        </h2>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 leading-relaxed">
          Tất cả các tính năng được thiết kế đồng bộ để học viên dễ dàng rèn luyện từng kỹ năng nhỏ, cọ xát với đề thi thật và theo dõi sự tiến bộ rõ rệt mỗi ngày.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WEWIN_FEATURES.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl border ${item.accentColor.border} bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${item.accentColor.iconBg}`}
                  >
                    <ItemIcon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.accentColor.badge}`}>
                    {item.badge}
                  </span>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  {item.category}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-wewin-navy transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Feature bullets */}
                <div className="space-y-2 mb-6">
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-zinc-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <Link
                href={item.link}
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${item.accentColor.button}`}
              >
                <span>{item.buttonLabel}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

