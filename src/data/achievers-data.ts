export interface AchieverProfile {
  id: string;
  name: string;
  roleOrClass: string;
  overallBand: number | string;
  scores: {
    listening: number | string;
    reading: number | string;
    writing: number | string;
    speaking: number | string;
  };
  /**
   * Đường dẫn ảnh đại diện học viên.
   * Để thêm ảnh thật:
   * 1. Copy file ảnh vào thư mục public/uploads/achievers/ (ví dụ: public/uploads/achievers/thao-vy.jpg)
   * 2. Điền đường dẫn tại đây: "/uploads/achievers/thao-vy.jpg"
   * Nếu để null, hệ thống sẽ tự động hiển thị khung placeholder chữ cái sang trọng.
   */
  avatarUrl?: string | null;
  badge?: string; // Ví dụ: "Xuất sắc 8.0 IELTS", "Bứt phá mục tiêu", "Reading 8.5"
  testimonial: string;
  examDate?: string;
  highlightSkill?: string;
}

/**
 * Danh sách học viên mẫu đại diện cho các mức Band điểm (7.0 - 8.5)
 * Thầy/Cô có thể dễ dàng thay đổi tên, điểm số, hình ảnh và nhận xét tại đây.
 */
export const ACHIEVERS_DATA: AchieverProfile[] = [
  {
    id: "achiever-1",
    name: "Lê Trần Thảo Vy",
    roleOrClass: "Lớp IELTS Master – Chi nhánh Nơ Trang Long",
    overallBand: "8.0",
    scores: {
      listening: "8.5",
      reading: "8.5",
      writing: "7.5",
      speaking: "7.5",
    },
    avatarUrl: null, // Khung mẫu: Điền "/uploads/achievers/thao-vy.jpg" khi có ảnh
    badge: "Thủ khoa Band 8.0+",
    testimonial:
      "Kho đề luyện thi trên Wewin có cấu trúc và áp lực thời gian sát 100% so với đề thi thật trên máy. Đặc biệt tính năng Shadowing và giải thích chi tiết đáp án Listening/Reading đã giúp mình tự tin bứt phá từ 6.5 lên 8.0 chỉ sau 3 tháng luyện tập.",
    examDate: "10/2026",
    highlightSkill: "Listening & Reading 8.5",
  },
  {
    id: "achiever-2",
    name: "Nguyễn Thành Vũ",
    roleOrClass: "Lớp Luyện đề Thực chiến – Chi nhánh Xô Viết Nghệ Tĩnh",
    overallBand: "7.5",
    scores: {
      listening: "8.0",
      reading: "8.0",
      writing: "7.0",
      speaking: "7.0",
    },
    avatarUrl: null,
    badge: "Bứt phá vượt mục tiêu",
    testimonial:
      "Trước khi đến với Wewin, phần Nghe của mình luôn bị mắc kẹt ở mức 6.0 vì hay sót các âm đuôi và nối âm. Nhờ công cụ Chép chính tả Dictation và kho đề Cambridge chuẩn, phản xạ nghe của mình tăng vọt lên 8.0.",
    examDate: "09/2026",
    highlightSkill: "Tăng 1.5 Band sau 2 tháng",
  },
  {
    id: "achiever-3",
    name: "Huỳnh Lâm Nhã Ái",
    roleOrClass: "Lớp IELTS Intensive 7.5+",
    overallBand: "7.5",
    scores: {
      listening: "8.0",
      reading: "8.5",
      writing: "7.0",
      speaking: "6.5",
    },
    avatarUrl: null,
    badge: "Reading Xuất Sắc 8.5",
    testimonial:
      "Phần bài tập Reading trên hệ thống có phần phân tích từ vựng chuyên sâu và định vị câu trả lời cực kỳ trực quan, giúp mình kiểm soát thời gian tốt và đạt điểm Reading 8.5 ngoài mong đợi.",
    examDate: "08/2026",
    highlightSkill: "Reading 8.5 / 40 câu đúng",
  },
  {
    id: "achiever-4",
    name: "Bùi Gia Bảo Khôi",
    roleOrClass: "Lớp Bứt tốc IELTS – Wewin Online Zoom",
    overallBand: "7.0",
    scores: {
      listening: "7.5",
      reading: "7.5",
      writing: "6.5",
      speaking: "6.5",
    },
    avatarUrl: null,
    badge: "Học viên xuất sắc",
    testimonial:
      "Hệ thống xếp hạng và theo dõi chuỗi ngày Streak tạo cho mình thói quen mỗi ngày đều vào làm ít nhất 1 bài tập hoặc luyện 1 đề ngắn. Giao diện trực quan, chấm điểm tức thì giúp mình luôn giữ vững kỷ luật học tập.",
    examDate: "10/2026",
    highlightSkill: "Speaking & Writing 6.5+",
  },
  {
    id: "achiever-5",
    name: "Trần Nguyên Khang",
    roleOrClass: "Lớp Chuyên sâu 4 Kỹ năng – Chi nhánh Nơ Trang Long",
    overallBand: "8.0",
    scores: {
      listening: "8.5",
      reading: "8.0",
      writing: "7.5",
      speaking: "7.5",
    },
    avatarUrl: null,
    badge: "Band 8.0 Toàn diện",
    testimonial:
      "Sự kết hợp giữa lớp học tương tác trực tiếp với thầy cô trên Zoom và kho đề luyện tập tự do trên web Wewin là giải pháp học tập hoàn hảo cho các bạn muốn đạt chứng chỉ gấp.",
    examDate: "07/2026",
    highlightSkill: "Toàn diện 4 kỹ năng",
  },
  {
    id: "achiever-6",
    name: "Nguyễn Lê Ngọc My",
    roleOrClass: "Lớp IELTS Foundation to 7.0",
    overallBand: "7.0",
    scores: {
      listening: "7.5",
      reading: "7.0",
      writing: "6.5",
      speaking: "7.0",
    },
    avatarUrl: null,
    badge: "Bứt phá Speaking 7.0",
    testimonial:
      "Tính năng Shadowing nhại giọng bản xứ là công cụ tuyệt vời nhất mình từng học. Nhờ luyện tập hàng ngày theo ngữ điệu và phát âm chuẩn, mình đã tự tin vượt qua phòng thi Speaking với band 7.0.",
    examDate: "09/2026",
    highlightSkill: "Speaking phản xạ 7.0",
  },
];

