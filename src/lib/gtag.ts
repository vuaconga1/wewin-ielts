/**
 * Tiện ích đo lường sự kiện cho Google Analytics 4 (GA4)
 * Hệ thống Multi-Subdomain WeWIN Education
 * Measurement ID mặc định: G-BHPHF3EMKF
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID || "G-BHPHF3EMKF";

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "set" | "js",
      targetIdOrAction: string | Date,
      params?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Gửi sự kiện tùy chỉnh (Custom Event) bất kỳ lên GA4
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined | null>
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/**
 * 1. Sự kiện Lượt đăng ký tư vấn / Mở chat / Nhận tài liệu (Lead Generation)
 */
export function trackLeadGeneration(data?: {
  formName?: string;
  source?: string;
  [key: string]: any;
}) {
  trackEvent("generate_lead", {
    form_name: data?.formName || "Tu_Van_IELTS",
    page_location: typeof window !== "undefined" ? window.location.href : "",
    ...data,
  });
}

/**
 * 2. Sự kiện Bắt đầu làm bài thi / Luyện tập IELTS
 */
export function trackQuizStart(data: {
  quizId?: string | number;
  quizTitle?: string;
  skill?: string;
  examType?: string;
  mode?: string;
  [key: string]: any;
}) {
  trackEvent("quiz_start", {
    quiz_id: data.quizId,
    quiz_title: data.quizTitle,
    skill: data.skill,
    exam_type: data.examType,
    mode: data.mode,
    page_location: typeof window !== "undefined" ? window.location.href : "",
    ...data,
  });
}

/**
 * 3. Sự kiện Hoàn thành bài thi / Nộp bài thi
 */
export function trackQuizComplete(data: {
  quizId?: string | number;
  quizTitle?: string;
  skill?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  timeSpentSeconds?: number;
  [key: string]: any;
}) {
  trackEvent("quiz_complete", {
    quiz_id: data.quizId,
    quiz_title: data.quizTitle,
    skill: data.skill,
    score: data.score,
    max_score: data.maxScore,
    percentage: data.percentage,
    time_spent_seconds: data.timeSpentSeconds,
    page_location: typeof window !== "undefined" ? window.location.href : "",
    ...data,
  });
}

/**
 * 4. Sự kiện Lượt click chuyển hướng sang Website chính hoặc Subdomain khác
 */
export function trackOutboundToMainSite(data?: {
  destinationUrl?: string;
  sourcePage?: string;
  linkText?: string;
  [key: string]: any;
}) {
  trackEvent("click_to_main_site", {
    destination_url: data?.destinationUrl || "https://wewin.edu.vn",
    source_page:
      data?.sourcePage ||
      (typeof window !== "undefined" ? window.location.pathname : ""),
    link_text: data?.linkText || "Trang chủ WeWIN",
    ...data,
  });
}

/**
 * 5. Sự kiện Tương tác với Chat Widget tư vấn (Fastbots AI)
 */
export function trackChatOpen(data?: {
  sourcePage?: string;
  [key: string]: any;
}) {
  trackEvent("open_chat_widget", {
    source_page:
      data?.sourcePage ||
      (typeof window !== "undefined" ? window.location.pathname : ""),
    ...data,
  });
}
