"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Clock,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";

type SkillKey = "listening" | "reading" | "writing" | "speaking";

interface SkillInfo {
  key: SkillKey;
  name: string;
  icon: typeof Headphones;
  time: string;
  parts: string;
  questionCount: string;
  badgeColor: string;
  highlightTool: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
  overview: string;
  structure: { title: string; desc: string }[];
  criteria: string[];
  tips: string[];
}

const SKILLS_DATA: Record<SkillKey, SkillInfo> = {
  listening: {
    key: "listening",
    name: "IELTS Listening",
    icon: Headphones,
    time: "30 phút (+ 2 phút kiểm tra trên máy)",
    parts: "4 Phần (Parts)",
    questionCount: "40 câu hỏi",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    highlightTool: {
      title: "Chép chính tả (Dictation) & Nghe điền từ",
      description: "Luyện bắt từ chi tiết, phân biệt âm đuôi và nối âm giúp nâng phản xạ nghe và tránh các bẫy ngữ âm thường gặp.",
      link: "/learn",
      buttonText: "Luyện nghe & Chép chính tả ngay",
    },
    overview:
      "Bài thi Listening bao gồm 4 đoạn ghi âm với độ khó tăng dần của người bản xứ (Anh, Úc, Mỹ, New Zealand). Bạn chỉ được nghe một lần duy nhất.",
    structure: [
      {
        title: "Part 1 (Hội thoại đời thường)",
        desc: "Cuộc trò chuyện giữa 2 người trong ngữ cảnh thường ngày (đặt phòng khách sạn, hỏi thông tin khoá học, mở tài khoản ngân hàng). Dạng bài: Form / Note Completion.",
      },
      {
        title: "Part 2 (Độc thoại cộng đồng)",
        desc: "Một bài nói về chủ đề xã hội (hướng dẫn tham quan bảo tàng, sơ đồ công viên, giới thiệu tiện ích). Dạng bài: Map / Plan Labelling, Multiple Choice.",
      },
      {
        title: "Part 3 (Thảo luận học thuật)",
        desc: "Cuộc thảo luận giữa 2-4 người về đề tài nghiên cứu hoặc dự án học tập. Dạng bài: Matching, Multiple Choice nâng cao.",
      },
      {
        title: "Part 4 (Bài giảng học thuật)",
        desc: "Một bài thuyết trình học thuật chuyên sâu từ giáo sư. Không có khoảng nghỉ giữa bài. Dạng bài: Summary / Sentence Completion.",
      },
    ],
    criteria: [
      "Nghe bắt từ chính xác (Keywords)",
      "Đúng chính tả tiếng Anh (Spelling & Plural -s)",
      "Kỹ năng nhận diện từ đồng nghĩa (Paraphrasing)",
      "Khả năng phán đoán loại từ cần điền",
    ],
    tips: [
      "Tận dụng thời gian đọc trước câu hỏi để gạch chân từ khóa và dự đoán loại từ cần điền.",
      "Cẩn thận với số ít / số nhiều và thì của động từ.",
      "Chú ý các từ chuyển ý (However, But, In contrast) vì đáp án thường nằm ngay sau đó.",
    ],
  },
  reading: {
    key: "reading",
    name: "IELTS Reading",
    icon: BookOpen,
    time: "60 phút (Không có thời gian chuyển bài)",
    parts: "3 Đoạn văn (Passages)",
    questionCount: "40 câu hỏi",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    highlightTool: {
      title: "Kho bài đọc phân tích từ vựng & Highlight giải thích",
      description: "Đọc bài có chú giải ngữ nghĩa theo ngữ cảnh, định vị đoạn trích chứa đáp án và phân tích từ đồng nghĩa giúp tối ưu tốc độ đọc.",
      link: "/tests",
      buttonText: "Luyện bài đọc thực chiến",
    },
    overview:
      "Bài thi Reading Academic gồm 3 đoạn văn dài (tổng khoảng 2,150 - 2,750 từ) trích từ sách báo, tạp chí khoa học và các bài nghiên cứu.",
    structure: [
      {
        title: "Passage 1 (Chủ đề mô tả/khoa học thường thức)",
        desc: "Thường dễ nhất trong 3 bài, liên quan đến lịch sử phát minh, hiện tượng tự nhiên hoặc tiểu sử nhân vật.",
      },
      {
        title: "Passage 2 (Vấn đề chuyên ngành hoặc xã hội)",
        desc: "Độ khó trung bình với nhiều thông tin chi tiết và thuật ngữ học thuật chuyên sâu.",
      },
      {
        title: "Passage 3 (Bài tranh luận/nghiên cứu phức tạp)",
        desc: "Đoạn văn dài với văn phong học thuật cao cấp, phân tích đa chiều quan điểm của các chuyên gia.",
      },
    ],
    criteria: [
      "Kỹ thuật Skimming (Đọc lướt nắm ý chính)",
      "Kỹ thuật Scanning (Quét tìm từ khóa cụ thể)",
      "Hiểu quan điểm và thái độ của tác giả",
      "Phân biệt True / False / Not Given & Yes / No / Not Given",
    ],
    tips: [
      "Phân bổ thời gian hợp lý: 15 phút cho Passage 1, 20 phút cho Passage 2 và 25 phút cho Passage 3.",
      "Làm quen với kỹ thuật định vị từ đồng nghĩa (paraphrase keywords) thay vì tìm từ giống hệt 100%.",
      "Ghi trực tiếp đáp án vào bài làm vì không có thời gian chuyển đáp án riêng.",
    ],
  },
  writing: {
    key: "writing",
    name: "IELTS Writing",
    icon: PenTool,
    time: "60 phút",
    parts: "2 Phần (Task 1 & Task 2)",
    questionCount: "2 bài viết",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    highlightTool: {
      title: "Kho bài mẫu Band 8.0+ & Phân tích cấu trúc câu",
      description: "Xem bài mẫu đạt chuẩn, học các cấu trúc ngữ pháp đắt giá và từ vựng học thuật theo từng chủ đề đề thi thật.",
      link: "/learn",
      buttonText: "Khám phá bài học Writing",
    },
    overview:
      "Đánh giá khả năng diễn đạt văn bản học thuật mạch lạc, sử dụng từ vựng phong phú và cấu trúc ngữ pháp chính xác.",
    structure: [
      {
        title: "Task 1 (Báo cáo số liệu & biểu đồ - 20 phút)",
        desc: "Viết tối thiểu 150 từ mô tả, tóm tắt hoặc giải thích biểu đồ (đường, cột, tròn, bảng số liệu), quy trình (Process) hoặc bản đồ (Map).",
      },
      {
        title: "Task 2 (Bài luận nghị luận xã hội - 40 phút)",
        desc: "Viết tối thiểu 250 từ trình bày quan điểm, lập luận hoặc giải pháp cho một vấn đề xã hội (Agree/Disagree, Discuss both views, Problem & Solution, Two-part question).",
      },
    ],
    criteria: [
      "Task Achievement / Task Response (Đáp ứng yêu cầu đề bài)",
      "Coherence & Cohesion (Tính mạch lạc và liên kết câu/đoạn)",
      "Lexical Resource (Vốn từ vựng phong phú và học thuật)",
      "Grammatical Range & Accuracy (Đa dạng và chuẩn xác ngữ pháp)",
    ],
    tips: [
      "Dành 3-5 phút lập dàn ý trước khi viết để ý tưởng luôn rõ ràng, không bị lạc đề.",
      "Task 2 chiếm 2/3 tổng số điểm Writing, hãy ưu tiên dành đủ 40 phút cho bài này.",
      "Luôn viết đủ số từ quy định (Task 1 >= 150 từ, Task 2 >= 250 từ) để tránh bị trừ điểm nặng.",
    ],
  },
  speaking: {
    key: "speaking",
    name: "IELTS Speaking",
    icon: Mic,
    time: "11 – 14 phút",
    parts: "3 Phần (Parts)",
    questionCount: "Phỏng vấn trực tiếp",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    highlightTool: {
      title: "Luyện phát âm & Shadowing nhại giọng người bản xứ",
      description: "Luyện nói theo phương pháp Shadowing với audio người bản ngữ, cải thiện ngữ điệu, nhấn âm và sự lưu loát tự nhiên.",
      link: "/learn",
      buttonText: "Luyện nói Shadowing ngay",
    },
    overview:
      "Bài thi Speaking là cuộc trò chuyện trực tiếp 1-1 với giám khảo bản ngữ (hoặc thi qua video trực tuyến trên máy tính), đánh giá khả năng giao tiếp tiếng Anh tự nhiên.",
    structure: [
      {
        title: "Part 1 (Phỏng vấn cá nhân - 4-5 phút)",
        desc: "Trả lời các câu hỏi quen thuộc về cuộc sống, gia đình, công việc, học tập, sở thích cá nhân.",
      },
      {
        title: "Part 2 (Độc thoại theo chủ đề - 3-4 phút)",
        desc: "Nhận một Cue Card và có 1 phút chuẩn bị trước khi nói liên tục từ 1 đến 2 phút về chủ đề đó.",
      },
      {
        title: "Part 3 (Thảo luận chuyên sâu - 4-5 phút)",
        desc: "Giám khảo đặt các câu hỏi mở rộng mang tính phân tích, đánh giá xã hội dựa trên chủ đề của Part 2.",
      },
    ],
    criteria: [
      "Fluency & Coherence (Độ trôi chảy và mạch lạc)",
      "Lexical Resource (Vốn từ vựng linh hoạt theo ngữ cảnh)",
      "Grammatical Range & Accuracy (Cấu trúc ngữ pháp đa dạng)",
      "Pronunciation (Phát âm chuẩn, trọng âm và ngữ điệu tự nhiên)",
    ],
    tips: [
      "Tự tin duy trì giao tiếp mắt với giám khảo và trả lời mở rộng thay vì chỉ 'Yes/No'.",
      "Sử dụng các cụm liên kết tự nhiên (Well, Actually, To be honest, From my perspective).",
      "Không học thuộc lòng bài mẫu, hãy phát triển câu trả lời dựa trên trải nghiệm thực tế.",
    ],
  },
};

// Raw score to Band Score mapping for Academic Listening & Reading
function rawToBand(raw: number, type: "listening" | "reading"): string {
  if (type === "listening") {
    if (raw >= 39) return "9.0";
    if (raw >= 37) return "8.5";
    if (raw >= 35) return "8.0";
    if (raw >= 32) return "7.5";
    if (raw >= 30) return "7.0";
    if (raw >= 26) return "6.5";
    if (raw >= 23) return "6.0";
    if (raw >= 18) return "5.5";
    if (raw >= 16) return "5.0";
    if (raw >= 13) return "4.5";
    if (raw >= 10) return "4.0";
    return "3.5 hoặc thấp hơn";
  } else {
    // Reading Academic
    if (raw >= 39) return "9.0";
    if (raw >= 37) return "8.5";
    if (raw >= 35) return "8.0";
    if (raw >= 33) return "7.5";
    if (raw >= 30) return "7.0";
    if (raw >= 27) return "6.5";
    if (raw >= 23) return "6.0";
    if (raw >= 19) return "5.5";
    if (raw >= 15) return "5.0";
    if (raw >= 13) return "4.5";
    if (raw >= 10) return "4.0";
    return "3.5 hoặc thấp hơn";
  }
}

export function IeltsOverview() {
  const [activeSkill, setActiveSkill] = useState<SkillKey>("listening");
  const [calcType, setCalcType] = useState<"listening" | "reading">("listening");
  const [correctCount, setCorrectCount] = useState<number>(30);

  const cur = SKILLS_DATA[activeSkill];
  const Icon = cur.icon;
  const estimatedBand = rawToBand(correctCount, calcType);

  return (
    <section id="ielts-overview" className="scroll-mt-20">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>KIẾN THỨC TOÀN DIỆN VỀ IELTS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
          Cấu Trúc Đề Thi & 4 Kỹ Năng Chuẩn Quốc Tế
        </h2>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 leading-relaxed">
          IELTS (International English Language Testing System) là chứng chỉ năng lực tiếng Anh uy tín nhất thế giới. Hiểu rõ cấu trúc từng phần là bước đầu tiên để đạt mục tiêu band điểm mong muốn.
        </p>
      </div>

      {/* 4 Skill Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {(["listening", "reading", "writing", "speaking"] as SkillKey[]).map((key) => {
          const item = SKILLS_DATA[key];
          const ItemIcon = item.icon;
          const isActive = activeSkill === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSkill(key)}
              className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                isActive
                  ? "bg-wewin-navy text-white border-wewin-navy shadow-md ring-2 ring-wewin-navy/20"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-300" : "text-zinc-500"}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Skill Content Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 mb-10 transition-all">
        {/* Top Header of Active Skill */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">{cur.name}</h3>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cur.badgeColor}`}>
                  {cur.parts}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                {cur.time} • {cur.questionCount}
              </p>
            </div>
          </div>

          {/* Wewin Tool Direct Action */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 hidden sm:block" />
            <div className="text-xs">
              <div className="font-semibold text-amber-900">{cur.highlightTool.title}</div>
              <div className="text-amber-700 text-[11px] line-clamp-1">{cur.highlightTool.description}</div>
            </div>
            <Link
              href={cur.highlightTool.link}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors"
            >
              Luyện ngay
            </Link>
          </div>
        </div>

        {/* Overview & Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">
                Tổng Quan & Yêu Cầu
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-100">
                {cur.overview}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">
                Chi Tiết Cấu Trúc Các Phần
              </h4>
              <div className="space-y-2.5">
                {cur.structure.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-zinc-150 bg-white hover:border-blue-200 transition-colors"
                  >
                    <div className="font-semibold text-xs sm:text-sm text-zinc-900">{item.title}</div>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {/* Criteria */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tiêu Chí Đánh Giá Của Giám Khảo</span>
              </h4>
              <ul className="space-y-1.5">
                {cur.criteria.map((c, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/60">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Mẹo Làm Bài Thực Chiến</span>
              </h4>
              <ul className="space-y-2">
                {cur.tips.map((t, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Band Score Calculator */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl text-white p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>CÔNG CỤ TRA CỨU ĐIỂM</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Bảng Quy Đổi Số Câu Đúng Ra Band Điểm
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 leading-relaxed">
              Kéo thanh trượt hoặc nhập số câu đúng (trên 40 câu) để biết mức Band điểm IELTS Listening & Reading Academic tương ứng của bạn.
            </p>
          </div>

          {/* Calculator box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full md:w-80 shrink-0">
            <div className="flex items-center gap-2 mb-4 bg-black/20 p-1 rounded-xl">
              <button
                onClick={() => setCalcType("listening")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  calcType === "listening"
                    ? "bg-amber-500 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Listening
              </button>
              <button
                onClick={() => setCalcType("reading")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  calcType === "reading"
                    ? "bg-amber-500 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Reading (Academic)
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-300">Số câu đúng:</span>
                <span className="text-base font-bold text-amber-400">{correctCount} / 40</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={correctCount}
                onChange={(e) => setCorrectCount(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] uppercase tracking-wider text-zinc-300">Band Điểm Dự Đoán</div>
              <div className="text-3xl font-black text-amber-400 mt-0.5">{estimatedBand}</div>
            </div>

            <Link
              href="/tests"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors"
            >
              <span>Vào làm bài test thật ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

