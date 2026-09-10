import type { LearnCatalog, LearnCourse, LearnLesson } from "@/lib/learn/types";

/** Short public sample MP4s (Google sample bucket) — good for testing anti-skip. */
const V = {
  short: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  med: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  joy: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  melt: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
};

function lesson(
  partial: Omit<LearnLesson, "exercises"> & { exercises: LearnLesson["exercises"] },
): LearnLesson {
  return partial;
}

export const SEED_COURSE: LearnCourse = {
  id: "ielts-4-skills",
  title: "IELTS 4 kỹ năng",
  description:
    "Học kiến thức nền theo từng kỹ năng: xem video bài giảng (không tua nhanh), làm bài tập nhỏ rồi mở khóa bài tiếp theo.",
  level: "A",
  lessons: [
    // —— Listening ——
    lesson({
      id: "lis-01",
      skill: "listening",
      title: "Tổng quan Listening IELTS",
      order: 1,
      summary: "Cấu trúc 4 section, thời gian và cách ghi đáp án trên answer sheet.",
      videoUrl: V.short,
      durationSec: 15,
      exercises: [
        {
          id: "lis-01-q1",
          type: "multiple_choice",
          prompt: "Listening IELTS Academic có bao nhiêu section?",
          options: ["A. 2", "B. 3", "C. 4", "D. 5"],
          answers: ["C", "C. 4", "4"],
        },
        {
          id: "lis-01-q2",
          type: "gap_fill",
          prompt: "Bạn được nghe mỗi đoạn audio bao nhiêu lần? (điền số)",
          answers: ["1", "một", "one"],
        },
      ],
    }),
    lesson({
      id: "lis-02",
      skill: "listening",
      title: "Dạng Gap-fill & Form completion",
      order: 2,
      summary: "Đọc trước câu hỏi, đoán từ loại và giới hạn số từ.",
      videoUrl: V.med,
      durationSec: 15,
      exercises: [
        {
          id: "lis-02-q1",
          type: "multiple_choice",
          prompt: "Khi đề ghi “NO MORE THAN TWO WORDS”, đáp án nào hợp lệ?",
          options: [
            "A. three bedroom flat",
            "B. double room",
            "C. a very large apartment",
          ],
          answers: ["B", "B. double room", "double room"],
        },
        {
          id: "lis-02-q2",
          type: "gap_fill",
          prompt: "Nên ___ trước khi nghe để đoán nội dung. (động từ: đọc/scan)",
          answers: ["đọc", "doc", "scan", "đọc trước", "read"],
        },
        {
          id: "lis-02-q3",
          type: "multiple_choice",
          prompt: "Nếu bỏ lỡ một câu, bạn nên:",
          options: [
            "A. Dừng lại suy nghĩ lâu",
            "B. Bỏ qua và theo dõi câu tiếp",
            "C. Tua lại audio",
          ],
          answers: ["B", "B. Bỏ qua và theo dõi câu tiếp"],
        },
      ],
    }),
    lesson({
      id: "lis-03",
      skill: "listening",
      title: "Multiple choice & Map labelling",
      order: 3,
      summary: "Loại trừ đáp án nhiễu và theo dõi hướng trên bản đồ.",
      videoUrl: V.joy,
      durationSec: 15,
      exercises: [
        {
          id: "lis-03-q1",
          type: "multiple_choice",
          prompt: "Đáp án nhiễu (distractor) thường là gì?",
          options: [
            "A. Từ không xuất hiện trong audio",
            "B. Từ được nhắc nhưng không phải câu trả lời đúng",
            "C. Luôn là đáp án A",
          ],
          answers: ["B", "B. Từ được nhắc nhưng không phải câu trả lời đúng"],
        },
        {
          id: "lis-03-q2",
          type: "gap_fill",
          prompt: "Khi làm map, hãy theo dõi các từ chỉ ___ (direction).",
          answers: ["hướng", "direction", "phương hướng"],
        },
      ],
    }),
    // —— Reading ——
    lesson({
      id: "rea-01",
      skill: "reading",
      title: "Tổng quan Reading IELTS",
      order: 1,
      summary: "3 passage, 40 câu, 60 phút — phân bổ thời gian hợp lý.",
      videoUrl: V.short,
      durationSec: 15,
      exercises: [
        {
          id: "rea-01-q1",
          type: "multiple_choice",
          prompt: "Reading Academic có bao nhiêu câu hỏi?",
          options: ["A. 20", "B. 30", "C. 40", "D. 50"],
          answers: ["C", "C. 40", "40"],
        },
        {
          id: "rea-01-q2",
          type: "gap_fill",
          prompt: "Thời gian làm Reading là ___ phút.",
          answers: ["60", "sáu mươi"],
        },
      ],
    }),
    lesson({
      id: "rea-02",
      skill: "reading",
      title: "Skimming & Scanning",
      order: 2,
      summary: "Đọc lướt lấy ý chính; quét tìm keyword và paraphrase.",
      videoUrl: V.melt,
      durationSec: 15,
      exercises: [
        {
          id: "rea-02-q1",
          type: "multiple_choice",
          prompt: "Skimming dùng để:",
          options: [
            "A. Tìm một con số cụ thể",
            "B. Nắm ý chính / cấu trúc bài",
            "C. Dịch từng câu",
          ],
          answers: ["B", "B. Nắm ý chính / cấu trúc bài"],
        },
        {
          id: "rea-02-q2",
          type: "gap_fill",
          prompt: "Scanning giúp bạn tìm ___ trong bài (keywords).",
          answers: ["từ khóa", "keyword", "keywords", "từ khoá"],
        },
      ],
    }),
    lesson({
      id: "rea-03",
      skill: "reading",
      title: "True / False / Not Given",
      order: 3,
      summary: "Phân biệt mâu thuẫn (False) và thông tin không có (Not Given).",
      videoUrl: V.med,
      durationSec: 15,
      exercises: [
        {
          id: "rea-03-q1",
          type: "multiple_choice",
          prompt: "Câu trong đề mâu thuẫn rõ với bài → chọn:",
          options: ["A. True", "B. False", "C. Not Given"],
          answers: ["B", "B. False", "False"],
        },
        {
          id: "rea-03-q2",
          type: "multiple_choice",
          prompt: "Bài không đề cập thông tin đó → chọn:",
          options: ["A. True", "B. False", "C. Not Given"],
          answers: ["C", "C. Not Given", "Not Given"],
        },
      ],
    }),
    // —— Writing ——
    lesson({
      id: "wri-01",
      skill: "writing",
      title: "Tổng quan Writing Task 1 & 2",
      order: 1,
      summary: "Task 1 báo cáo số liệu; Task 2 luận điểm — trọng số điểm khác nhau.",
      videoUrl: V.joy,
      durationSec: 15,
      exercises: [
        {
          id: "wri-01-q1",
          type: "multiple_choice",
          prompt: "Task nào thường chiếm trọng số điểm cao hơn?",
          options: ["A. Task 1", "B. Task 2", "C. Bằng nhau"],
          answers: ["B", "B. Task 2"],
        },
        {
          id: "wri-01-q2",
          type: "gap_fill",
          prompt: "Task 1 Academic thường mô tả biểu đồ / ___ / quy trình.",
          answers: ["bảng", "table", "map", "bản đồ", "process"],
        },
      ],
    }),
    lesson({
      id: "wri-02",
      skill: "writing",
      title: "Cấu trúc Task 2 essay",
      order: 2,
      summary: "Introduction – Body – Conclusion; một ý rõ mỗi đoạn.",
      videoUrl: V.short,
      durationSec: 15,
      exercises: [
        {
          id: "wri-02-q1",
          type: "multiple_choice",
          prompt: "Đoạn mở bài Task 2 nên gồm:",
          options: [
            "A. Chỉ paraphrase đề",
            "B. Paraphrase + nêu quan điểm / hướng bài",
            "C. Kết luận luôn",
          ],
          answers: ["B", "B. Paraphrase + nêu quan điểm / hướng bài"],
        },
        {
          id: "wri-02-q2",
          type: "gap_fill",
          prompt: "Mỗi body paragraph nên có topic ___ rõ ràng.",
          answers: ["sentence", "câu", "topic sentence"],
        },
      ],
    }),
    // —— Speaking ——
    lesson({
      id: "spe-01",
      skill: "speaking",
      title: "Tổng quan Speaking 3 part",
      order: 1,
      summary: "Part 1 quen thuộc, Part 2 cue card, Part 3 thảo luận.",
      videoUrl: V.melt,
      durationSec: 15,
      exercises: [
        {
          id: "spe-01-q1",
          type: "multiple_choice",
          prompt: "Part 2 Speaking thường kéo dài khoảng:",
          options: ["A. 30 giây", "B. 1–2 phút", "C. 5 phút"],
          answers: ["B", "B. 1–2 phút"],
        },
        {
          id: "spe-01-q2",
          type: "gap_fill",
          prompt: "Trước khi nói Part 2 bạn có ___ phút chuẩn bị.",
          answers: ["1", "một", "one"],
        },
      ],
    }),
    lesson({
      id: "spe-02",
      skill: "speaking",
      title: "Mở rộng ý & fluency",
      order: 2,
      summary: "Trả lời đủ ý: What – Why – Example; tránh trả lời một câu ngắn.",
      videoUrl: V.med,
      durationSec: 15,
      exercises: [
        {
          id: "spe-02-q1",
          type: "multiple_choice",
          prompt: "Cách mở rộng câu trả lời Part 1 hiệu quả:",
          options: [
            "A. Chỉ Yes/No",
            "B. Trả lời + lý do + ví dụ ngắn",
            "C. Học thuộc đoạn dài không liên quan",
          ],
          answers: ["B", "B. Trả lời + lý do + ví dụ ngắn"],
        },
        {
          id: "spe-02-q2",
          type: "gap_fill",
          prompt: "Tiêu chí Fluency & ___ đánh giá độ trôi chảy và mạch lạc.",
          answers: ["coherence", "Coherence"],
        },
      ],
    }),
  ],
};

export const SEED_CATALOG: LearnCatalog = {
  courses: [SEED_COURSE],
};

/** @deprecated Use SEED_COURSE / SEED_CATALOG */
export const SEED_CURRICULUM = SEED_COURSE;
