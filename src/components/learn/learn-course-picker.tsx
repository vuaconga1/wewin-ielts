"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  Headphones,
  Layers,
  Lightbulb,
  Lock,
  MessageCircleQuestion,
  Mic,
  Search,
  SlidersHorizontal,
  Target,
  TextCursorInput,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  learnCourseHref,
  learnDictationHref,
  learnFillBlankHref,
  learnIeltsCourseHref,
  learnListenAnswerHref,
  learnShadowingHref,
  learnVocabGrammarHref,
} from "@/lib/learn/hrefs";
import type { IeltsSlideCourse } from "@/lib/learn/vocab-grammar-types";
import { useTranslations } from "@/i18n/provider";
import { openWewinChat } from "@/components/chat/wewin-chat-widget";
import { BuyCourseButton } from "@/components/learn/buy-course-button";
import { coursePriceVnd, formatVnd } from "@/lib/learn/course-pricing";
import { canViewIeltsGrammar, type AppRole } from "@/lib/auth/roles";
import {
  fetchSessionMe,
  peekSessionMe,
  subscribeSessionMe,
} from "@/lib/client/session-me";

/** `undefined` until the client session is known (server render included). */
function viewerRoleSnapshot(): AppRole | null | undefined {
  const session = peekSessionMe();
  if (!session) return undefined;
  return (session.user?.role as AppRole | undefined) ?? null;
}

function serverViewerRole(): AppRole | null | undefined {
  return undefined;
}

export type CourseCard = {
  id: string;
  title: string;
  description: string;
  level?: string;
  total: number;
  completed: number;
  percent: number;
};

export type VocabGrammarCard = {
  total: number;
  completed: number;
  percent: number;
};

export type IeltsCourseCard = VocabGrammarCard & { course: IeltsSlideCourse };

type Props = {
  courses: CourseCard[];
  ieltsCourses: IeltsCourseCard[];
  vocabGrammar: VocabGrammarCard;
};

type FilterCategory = "all" | "ielts" | "vocab-grammar" | "skills";
type SortOption = "default" | "progress" | "name";

const CATEGORY_FILTERS: { id: FilterCategory; label: string; icon?: LucideIcon }[] = [
  { id: "all", label: "Tất cả" },
  { id: "ielts", label: "IELTS", icon: GraduationCap },
  { id: "vocab-grammar", label: "Từ vựng & ngữ pháp", icon: BookMarked },
  { id: "skills", label: "Kỹ năng", icon: Headphones },
];

const CATEGORY_ICONS: Record<"ielts" | "vocab-grammar" | "skills" | "general", LucideIcon> = {
  ielts: GraduationCap,
  "vocab-grammar": BookMarked,
  skills: Headphones,
  general: Layers,
};

const PRACTICE_LABS: {
  key: string;
  href: () => string;
  icon: LucideIcon;
  iconClass: string;
  accentColor: string;
  tag: string;
  tagClass: string;
  title: string;
  description: string;
}[] = [
  {
    key: "dictation",
    href: learnDictationHref,
    icon: Headphones,
    iconClass: "bg-blue-50 text-blue-600",
    accentColor: "bg-blue-600",
    tag: "Listening",
    tagClass: "text-blue-600",
    title: "Nghe chép chính tả",
    description: "Nghe audio ngắn, gõ lại nội dung và kiểm tra độ chính xác từng từ.",
  },
  {
    key: "fill-blank",
    href: learnFillBlankHref,
    icon: TextCursorInput,
    iconClass: "bg-emerald-50 text-emerald-600",
    accentColor: "bg-emerald-600",
    tag: "Gap Fill",
    tagClass: "text-emerald-600",
    title: "Nghe điền từ",
    description: "Bắt trọn từ khóa, số liệu và tên riêng trong bài nghe Cambridge.",
  },
  {
    key: "listen-answer",
    href: learnListenAnswerHref,
    icon: MessageCircleQuestion,
    iconClass: "bg-purple-50 text-purple-600",
    accentColor: "bg-purple-600",
    tag: "Q&A",
    tagClass: "text-purple-600",
    title: "Nghe & trả lời",
    description: "Nghe đoạn văn ngắn và trả lời câu hỏi bằng câu ngắn tiếng Anh.",
  },
  {
    key: "shadowing",
    href: learnShadowingHref,
    icon: Mic,
    iconClass: "bg-amber-50 text-amber-600",
    accentColor: "bg-amber-500",
    tag: "Speaking",
    tagClass: "text-amber-600",
    title: "Shadowing — Luyện nói",
    description: "Ghi âm giọng đọc, so sánh ngữ điệu chuẩn người bản xứ với AI.",
  },
];

export function LearnCoursePicker({ courses, ieltsCourses, vocabGrammar }: Props) {
  const { t } = useTranslations("learn");
  const { t: tChat } = useTranslations("chatWidget");
  const { t: tBuy } = useTranslations("purchase");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const viewerRole = useSyncExternalStore(
    subscribeSessionMe,
    viewerRoleSnapshot,
    serverViewerRole,
  );
  useEffect(() => {
    void fetchSessionMe();
  }, []);
  const lockStudentOnly = viewerRole !== undefined && !canViewIeltsGrammar(viewerRole);

  // Map individual IELTS slide courses
  const ielts34 = ieltsCourses.find((c) => c.course === "ielts-3-4");
  const ielts45 = ieltsCourses.find((c) => c.course === "ielts-4-5");
  const ielts56 = ieltsCourses.find((c) => c.course === "ielts-5-6");

  // Calculate overall learning progress
  const totalLessons = useMemo(() => {
    const ieltsTotal = ieltsCourses.reduce((sum, c) => sum + c.total, 0);
    const standardTotal = courses.reduce((sum, c) => sum + c.total, 0);
    return ieltsTotal + standardTotal + vocabGrammar.total;
  }, [ieltsCourses, courses, vocabGrammar]);

  const completedLessons = useMemo(() => {
    const ieltsDone = ieltsCourses.reduce((sum, c) => sum + c.completed, 0);
    const standardDone = courses.reduce((sum, c) => sum + c.completed, 0);
    return ieltsDone + standardDone + vocabGrammar.completed;
  }, [ieltsCourses, courses, vocabGrammar]);

  const overallPercent = useMemo(() => {
    if (totalLessons === 0) return 25; // default fallback demo percent
    return Math.min(100, Math.round((completedLessons / totalLessons) * 100));
  }, [completedLessons, totalLessons]);

  // Unified items list for cards grid
  type UnifiedItem = {
    id: string;
    key: string;
    title: string;
    description: string;
    category: "ielts" | "vocab-grammar" | "skills" | "general";
    level: string;
    metaInfo: string;
    instructor: string;
    materials: string;
    badgeLabel: string;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
    href: string;
    completed: number;
    total: number;
    percent: number;
    actionLabel: string;
    /** Gated by `canViewIeltsGrammar` (class members and staff). */
    studentOnly?: boolean;
    /** Shown with a buy button while the course is locked for the viewer. */
    priceVnd?: number | null;
  };

  const unifiedList = useMemo<UnifiedItem[]>(() => {
    const list: UnifiedItem[] = [];

    // 1. IELTS 3.0 – 4.0
    list.push({
      id: "ielts-3-4",
      key: "ielts-3-4",
      title: "IELTS 3.0 – 4.0",
      description: "Xây dựng nền tảng, làm quen cấu trúc bài thi.",
      category: "ielts",
      level: "Beginner",
      metaInfo: "4 khóa học · 48 bài học",
      instructor: "Đội ngũ WeWIN",
      materials: "Cambridge + WeWIN",
      badgeLabel: "IELTS",
      accentColor: "bg-[#2563eb]", // WeWin blue
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      badgeText: "text-blue-700",
      href: learnIeltsCourseHref("ielts-3-4"),
      completed: ielts34?.completed || 0,
      total: ielts34?.total || 48,
      percent: ielts34?.percent || 0,
      actionLabel: "Xem lộ trình →",
      studentOnly: true,
      priceVnd: coursePriceVnd("ielts-3-4"),
    });

    // 2. IELTS 4.0 – 5.0
    list.push({
      id: "ielts-4-5",
      key: "ielts-4-5",
      title: "IELTS 4.0 – 5.0",
      description: "Phát triển kỹ năng, tăng tốc điểm số.",
      category: "ielts",
      level: "Pre-Intermediate",
      metaInfo: "4 khóa học · 60 bài học",
      instructor: "Đội ngũ WeWIN",
      materials: "Cambridge + WeWIN",
      badgeLabel: "IELTS",
      accentColor: "bg-[#d4af37]", // WeWin Gold
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      badgeText: "text-amber-800",
      href: learnIeltsCourseHref("ielts-4-5"),
      completed: ielts45?.completed || 0,
      total: ielts45?.total || 60,
      percent: ielts45?.percent || 0,
      actionLabel: "Xem lộ trình →",
      studentOnly: true,
      priceVnd: coursePriceVnd("ielts-4-5"),
    });

    // 3. IELTS 5.0 – 6.0
    list.push({
      id: "ielts-5-6",
      key: "ielts-5-6",
      title: "IELTS 5.0 – 6.0",
      description: "Nâng cao chiến thuật, chinh phục mục tiêu.",
      category: "ielts",
      level: "Intermediate",
      metaInfo: "4 khóa học · 72 bài học",
      instructor: "Đội ngũ WeWIN",
      materials: "Cambridge + WeWIN",
      badgeLabel: "IELTS",
      accentColor: "bg-[#0d1b3e]", // WeWin Navy
      badgeBg: "bg-slate-100 text-[#0d1b3e] border-slate-300",
      badgeText: "text-[#0d1b3e]",
      href: learnIeltsCourseHref("ielts-5-6"),
      completed: ielts56?.completed || 0,
      total: ielts56?.total || 72,
      percent: ielts56?.percent || 0,
      actionLabel: "Xem lộ trình →",
      studentOnly: true,
      priceVnd: coursePriceVnd("ielts-5-6"),
    });

    // 4. Essential Vocabulary & Grammar
    list.push({
      id: "vocab-grammar",
      key: "vocab-grammar",
      title: "Essential Vocabulary & Grammar",
      description: "Nền tảng từ vựng và ngữ pháp học thuật.",
      category: "vocab-grammar",
      level: "All levels",
      metaInfo: "3 khóa học · 36 bài học",
      instructor: "Đội ngũ WeWIN",
      materials: "WeWIN + Cambridge",
      badgeLabel: "Từ vựng & ngữ pháp",
      accentColor: "bg-[#059669]", // Emerald
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badgeText: "text-emerald-700",
      href: learnVocabGrammarHref(),
      completed: vocabGrammar.completed,
      total: vocabGrammar.total || 36,
      percent: vocabGrammar.percent,
      actionLabel: "Xem lộ trình →",
    });

    // 5. Listening & Reading Practice
    list.push({
      id: "practice-listen-read",
      key: "practice-listen-read",
      title: "Listening & Reading Practice",
      description: "Luyện kỹ năng nghe - đọc theo chủ đề thực tế.",
      category: "skills",
      level: "All levels",
      metaInfo: "3 khóa học · 42 bài học",
      instructor: "Đội ngũ WeWIN",
      materials: "Cambridge + WeWIN",
      badgeLabel: "Kỹ năng",
      accentColor: "bg-[#7c3aed]", // Purple
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      badgeText: "text-purple-700",
      href: learnDictationHref(),
      completed: 0,
      total: 42,
      percent: 0,
      actionLabel: "Xem lộ trình →",
    });

    // 6. Speaking & Writing Practice
    list.push({
      id: "practice-speak-write",
      key: "practice-speak-write",
      title: "Speaking & Writing Practice",
      description: "Tự tin giao tiếp, viết bài chuẩn band.",
      category: "skills",
      level: "All levels",
      metaInfo: "3 khóa học · 42 bài học",
      instructor: "Đội ngũ WeWIN",
      materials: "Cambridge + WeWIN",
      badgeLabel: "Kỹ năng",
      accentColor: "bg-[#0284c7]", // Sky blue
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      badgeText: "text-sky-700",
      href: learnShadowingHref(),
      completed: 0,
      total: 42,
      percent: 0,
      actionLabel: "Xem lộ trình →",
    });

    // 7. Extra courses from DB/seed (e.g. IELTS 4 kỹ năng)
    courses.forEach((course) => {
      list.push({
        id: course.id,
        key: course.id,
        title: course.title,
        description: course.description,
        category: "ielts",
        level: course.level || "Foundation",
        metaInfo: `${course.total} bài học`,
        instructor: "Đội ngũ WeWIN",
        materials: "WeWIN System",
        badgeLabel: "Khóa học",
        accentColor: "bg-[#d4af37]",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
        badgeText: "text-amber-800",
        href: learnCourseHref(course.id),
        completed: course.completed,
        total: course.total,
        percent: course.percent,
        actionLabel: "Vào khóa học →",
      });
    });

    return list;
  }, [courses, ielts34, ielts45, ielts56, vocabGrammar]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = unifiedList;

    if (activeCategory !== "all") {
      result = result.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.instructor.toLowerCase().includes(q) ||
          item.materials.toLowerCase().includes(q) ||
          item.badgeLabel.toLowerCase().includes(q) ||
          item.level.toLowerCase().includes(q),
      );
    }

    if (sortBy === "progress") {
      result = [...result].sort((a, b) => b.percent - a.percent);
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [unifiedList, activeCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 font-medium">
        <Link href="/" className="flex items-center gap-1.5 hover:text-wewin-navy transition-colors">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Học tập</span>
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-wewin-navy font-semibold">Khóa học</span>
      </nav>

      {/* Main Grid: Left 3/4 content, Right 1/4 sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Main Catalog Content */}
        {/* ========================================================= */}
        <div className="space-y-6 lg:col-span-8 xl:col-span-9 min-w-0">
          {/* ========================================================= */}
          {/* FEATURED ROADMAP BANNER */}
          {/* ========================================================= */}
          <section data-tour="learn-header" className="relative overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-r from-white via-blue-50/40 to-amber-50/30 p-5 sm:p-6 shadow-sm transition hover:shadow-md">
            {/* Soft background accents */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-100/50 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 right-48 h-36 w-36 rounded-full bg-amber-100/40 blur-2xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Left Side: Title + Stepper + Stats */}
              <div className="space-y-4 max-w-2xl min-w-0">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wewin-accent-blue">
                    LỘ TRÌNH NỔI BẬT
                  </span>
                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-wewin-navy sm:text-2xl">
                    Lộ trình IELTS toàn diện
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-zinc-600">
                    Từ nền tảng đến mục tiêu 6.5+
                  </p>
                </div>

                {/* Horizontal Stepper */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-1 scrollbar-none">
                  {/* Step 1 */}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white/90 px-3 py-1.5 shadow-xs">
                    <span className="text-xs font-bold text-wewin-navy">3.0 – 4.0</span>
                    <span className="text-[10px] font-medium text-zinc-500">Pre-IELTS</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />

                  {/* Step 2 */}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-white/90 px-3 py-1.5 shadow-xs">
                    <span className="text-xs font-bold text-amber-800">4.0 – 5.0</span>
                    <span className="text-[10px] font-medium text-zinc-500">Foundation</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />

                  {/* Step 3 */}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white/90 px-3 py-1.5 shadow-xs">
                    <span className="text-xs font-bold text-[#0d1b3e]">5.0 – 6.0</span>
                    <span className="text-[10px] font-medium text-zinc-500">Intermediate</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />

                  {/* Step 4 */}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white/90 px-3 py-1.5 shadow-xs">
                    <span className="text-xs font-bold text-emerald-700">6.0 – 6.5+</span>
                    <span className="text-[10px] font-medium text-zinc-500">Advanced</span>
                  </div>
                </div>

                {/* Quick Meta Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-wewin-navy" />
                    <span>4 khóa học chính</span>
                  </div>
                  <span className="text-zinc-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-wewin-navy" />
                    <span>180+ bài học</span>
                  </div>
                  <span className="text-zinc-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-wewin-navy" />
                    <span>6 – 12 tháng</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Circular Progress + CTA Button */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-t border-blue-100/80 pt-4 md:border-t-0 md:pt-0 md:flex-col md:items-end md:justify-center">
                <div className="flex items-center gap-3">
                  {/* Circular Progress Gauge */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-wewin-accent-blue transition-all duration-700 ease-out"
                        strokeDasharray={`${overallPercent}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-bold text-wewin-navy">{overallPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">Hoàn thành lộ trình</p>
                    <p className="text-[11px] text-zinc-500">
                      {completedLessons > 0
                        ? `${completedLessons}/${totalLessons} bài học`
                        : "Khởi đầu vững chắc"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRoadmapModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-wewin-navy/20 bg-white px-3.5 py-2 text-xs font-semibold text-wewin-navy shadow-xs transition hover:bg-wewin-navy hover:text-white"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION: Practice Lab */}
          {/* ========================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-wewin-navy" />
              <h2 className="text-lg font-bold text-wewin-navy sm:text-xl">
                Luyện tập kỹ năng
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {PRACTICE_LABS.map((lab) => {
                const Icon = lab.icon;
                return (
                  <Link
                    key={lab.key}
                    href={lab.href()}
                    className="group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 pl-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 ${lab.accentColor}`} aria-hidden />
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${lab.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${lab.tagClass}`}>
                        {lab.tag}
                      </span>
                      <h3 className="break-words text-sm font-bold text-zinc-900 transition-colors group-hover:text-wewin-navy sm:text-base">
                        {lab.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                        {lab.description}
                      </p>
                    </div>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-wewin-navy transition-colors group-hover:bg-wewin-navy group-hover:text-white"
                      title={t("cardPracticeNow", "Luyện ngay")}
                    >
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      <span className="sr-only">{t("cardPracticeNow", "Luyện ngay")}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION: Featured Courses Grid */}
          {/* ========================================================= */}
          <section data-tour="learn-courses" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-wewin-navy" />
                <h2 className="text-lg font-bold text-wewin-navy sm:text-xl">
                  Các khóa học nổi bật
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-wewin-accent-blue hover:underline"
              >
                Xem tất cả →
              </button>
            </div>

            {/* Search, sort & category filter */}
            <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-0 flex-1 sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm khóa học, kỹ năng, giảng viên..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-all focus:border-wewin-accent-blue focus:outline-none focus:ring-2 focus:ring-wewin-accent-blue/20"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:text-zinc-600"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <div className="relative self-start sm:self-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-slate-300 focus:border-wewin-accent-blue focus:outline-none focus:ring-2 focus:ring-wewin-accent-blue/20 cursor-pointer"
                  >
                    <option value="default">Mới nhất</option>
                    <option value="progress">Tiến độ học cao nhất</option>
                    <option value="name">Tên A – Z</option>
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORY_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveCategory(filter.id)}
                      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                        activeCategory === filter.id
                          ? "bg-wewin-navy text-white shadow-sm ring-2 ring-wewin-navy/20"
                          : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-50 hover:text-zinc-900"
                      }`}
                    >
                      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty Search State */}
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-zinc-300" />
                <h3 className="mt-2 text-sm font-bold text-zinc-800">Không tìm thấy khóa học phù hợp</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-3 rounded-lg bg-wewin-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-wewin-navy-hover"
                >
                  Xem toàn bộ khóa học
                </button>
              </div>
            ) : (
              /* Grid of Cards */
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item) => {
                  const hasProgress = item.total > 0;
                  const isDone = item.completed === item.total && item.total > 0;
                  const locked = Boolean(item.studentOnly) && lockStudentOnly;
                  const buyPrice = locked && item.priceVnd ? item.priceVnd : null;

                  const CategoryIcon = CATEGORY_ICONS[item.category];
                  const started = hasProgress && item.completed > 0;

                  return (
                    <div
                      key={item.key}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      {/* Card Body */}
                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        {/* Header: category icon + badge/level + title */}
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${item.accentColor}`}
                          >
                            <CategoryIcon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.badgeBg}`}
                              >
                                {item.badgeLabel}
                              </span>
                              <span className="text-[11px] font-medium text-zinc-500">{item.level}</span>
                            </div>
                            <h3 className="mt-1 break-words text-base font-bold leading-snug text-zinc-900 transition-colors group-hover:text-wewin-navy">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                          {item.description}
                        </p>

                        {/* Meta */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                            {item.metaInfo}
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            <span className="truncate">{item.materials}</span>
                          </span>
                        </div>

                        {/* Progress */}
                        {hasProgress ? (
                          <div className="mt-auto pt-4">
                            <div className="mb-1.5 flex items-center justify-between text-[11px]">
                              <span className={started ? "font-semibold text-wewin-navy" : "text-zinc-400"}>
                                {started
                                  ? t(
                                      "cardLessonsDone",
                                      { done: item.completed, total: item.total },
                                      `${item.completed}/${item.total} bài hoàn thành`,
                                    )
                                  : t("cardNotStarted", "Chưa bắt đầu")}
                              </span>
                              <span className="font-semibold tabular-nums text-zinc-500">{Math.round(item.percent)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${item.accentColor}`}
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                        {buyPrice ? (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800">
                                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                                {t("studentOnly", "Chỉ dành cho học viên")}
                              </p>
                              <p className="text-base font-extrabold tabular-nums text-red-600">
                                <span className="sr-only">{tBuy("price", "Học phí")}: </span>
                                {formatVnd(buyPrice)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={item.href}
                                prefetch={false}
                                className="inline-flex items-center rounded-xl border border-wewin-navy/20 bg-white px-3 py-1.5 text-xs font-semibold text-wewin-navy transition hover:bg-slate-50"
                              >
                                {item.actionLabel}
                              </Link>
                              <BuyCourseButton courseTitle={item.title} priceVnd={buyPrice} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            {locked ? (
                              <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-bold text-amber-800">
                                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                                <span className="truncate">{t("studentOnly", "Chỉ dành cho học viên")}</span>
                              </span>
                            ) : (
                              <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-500">
                                <Users className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <span className="truncate">{item.instructor}</span>
                              </span>
                            )}
                            <Link
                              href={item.href}
                              prefetch={false}
                              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-wewin-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:gap-1.5 hover:bg-wewin-navy-hover"
                            >
                              {locked ? <Lock className="h-3 w-3" aria-hidden /> : null}
                              <span>{isDone ? "Ôn lại →" : item.actionLabel}</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Sidebar (Lộ trình của tôi + Gợi ý mục tiêu) */}
        {/* ========================================================= */}
        <aside className="space-y-6 lg:col-span-4 xl:col-span-3">
          {/* Card 1: Lộ trình của tôi */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-wewin-navy" />
                <h3 className="text-sm font-bold text-wewin-navy">Lộ trình của tôi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoadmapModal(true)}
                className="text-xs font-semibold text-wewin-accent-blue hover:underline"
              >
                Xem tất cả →
              </button>
            </div>

            {/* Vertical Stepper Timeline */}
            <div className="relative mt-4 space-y-4 pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Milestone 1: 3.0 – 4.0 */}
              <div className="relative group cursor-pointer" onClick={() => setActiveCategory("ielts")}>
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-wewin-accent-blue transition-colors">
                    IELTS 3.0 – 4.0
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {ielts34 && ielts34.completed > 0
                    ? `Đang học · ${ielts34.completed}/${ielts34.total} khóa học`
                    : "Đang học · 2/4 khóa học"}
                </p>
              </div>

              {/* Milestone 2: 4.0 – 5.0 */}
              <div className="relative group cursor-pointer" onClick={() => setActiveCategory("ielts")}>
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-white ring-4 ring-white">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-wewin-accent-blue transition-colors">
                    IELTS 4.0 – 5.0
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {ielts45 && ielts45.completed > 0
                    ? `Đang học · ${ielts45.completed}/${ielts45.total} khóa học`
                    : "Sắp học · 0/4 khóa học"}
                </p>
              </div>

              {/* Milestone 3: 5.0 – 6.0 */}
              <div className="relative group cursor-pointer" onClick={() => setActiveCategory("ielts")}>
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-zinc-400 ring-4 ring-white">
                  <Lock className="h-2.5 w-2.5" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-700 group-hover:text-wewin-navy transition-colors">
                    IELTS 5.0 – 6.0
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-zinc-400">Khóa học tiếp theo</p>
              </div>

              {/* Milestone 4: 6.0+ */}
              <div className="relative group cursor-pointer" onClick={() => setShowRoadmapModal(true)}>
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-zinc-400 ring-4 ring-white">
                  <Lock className="h-2.5 w-2.5" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-700 group-hover:text-wewin-navy transition-colors">
                    IELTS 6.0+
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-zinc-400">Khóa học tiếp theo</p>
              </div>
            </div>
          </div>

          {/* Card 2: Gợi ý theo mục tiêu */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Target className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-wewin-navy">Gợi ý theo mục tiêu</h3>
            </div>

            {/* Target 1 */}
            <Link
              href={learnIeltsCourseHref("ielts-5-6")}
              className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-zinc-900 group-hover:text-wewin-accent-blue transition-colors">
                  Đạt 6.5+ để du học
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  Lộ trình chuyên sâu, tập trung kỹ năng yếu
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-wewin-accent-blue group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Target 2 */}
            <Link
              href={learnShadowingHref()}
              className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-zinc-900 group-hover:text-wewin-accent-blue transition-colors">
                  Cải thiện kỹ năng Speaking
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  Thực hành giao tiếp với giáo viên
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-wewin-accent-blue group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Target 3 */}
            <Link
              href={learnVocabGrammarHref()}
              className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-zinc-900 group-hover:text-wewin-accent-blue transition-colors">
                  Tăng điểm nhanh
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  Khóa học cấp tốc, tối ưu thời gian
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-wewin-accent-blue group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Card 3: Tư vấn / Chưa biết bắt đầu từ đâu */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-50/70 to-orange-50/60 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Lightbulb className="h-3.5 w-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">
                  Chưa biết nên bắt đầu từ đâu?
                </h4>
                <button
                  type="button"
                  onClick={openWewinChat}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-wewin-accent-blue hover:underline text-left"
                >
                  <span>{tChat("cardCta", "Chat với WEWIN để được tư vấn lộ trình →")}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: Chi tiết Lộ trình IELTS Toàn diện WeWIN */}
      {/* ========================================================= */}
      {showRoadmapModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowRoadmapModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-slate-100 hover:text-zinc-700"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-wewin-accent-blue uppercase tracking-wider">
                WEWIN ROADMAP
              </span>
              <h3 className="mt-1 text-xl font-bold text-wewin-navy">
                Lộ trình IELTS Toàn diện 3.0 đến 6.5+
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600">
                Lộ trình 4 giai đoạn chuẩn quốc tế, tinh chỉnh bài bản theo chuẩn khảo thí Cambridge.
              </p>
            </div>

            <div className="mt-5 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Stage 1 */}
              <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-wewin-navy">Pre-IELTS (Band 3.0 – 4.0)</h4>
                    <span className="text-[11px] font-semibold text-blue-700">60 giờ</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Lấy lại gốc phát âm IPA, nạp 1.200 từ vựng căn bản và làm quen cấu trúc 4 kỹ năng trong đề thi IELTS.
                  </p>
                  <div className="mt-2">
                    <Link
                      href={learnIeltsCourseHref("ielts-3-4")}
                      onClick={() => setShowRoadmapModal(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-wewin-accent-blue hover:underline"
                    >
                      Vào khóa học này →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-wewin-gold text-white font-bold text-xs">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-wewin-navy">Foundation (Band 4.0 – 5.0)</h4>
                    <span className="text-[11px] font-semibold text-amber-800">75 giờ</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Làm quen các dạng đề Nghe - Đọc học thuật, thực hành Speaking Part 1 và Writing Task 1 cơ bản.
                  </p>
                  <div className="mt-2">
                    <Link
                      href={learnIeltsCourseHref("ielts-4-5")}
                      onClick={() => setShowRoadmapModal(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline"
                    >
                      Vào khóa học này →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-wewin-navy text-white font-bold text-xs">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-wewin-navy">Intermediate (Band 5.0 – 6.0)</h4>
                    <span className="text-[11px] font-semibold text-[#0d1b3e]">90 giờ</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Phát triển chiến thuật làm bài chuyên sâu, mở rộng từ vựng C1, làm chủ Speaking Part 2-3 và Writing Task 2.
                  </p>
                  <div className="mt-2">
                    <Link
                      href={learnIeltsCourseHref("ielts-5-6")}
                      onClick={() => setShowRoadmapModal(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-wewin-navy hover:underline"
                    >
                      Vào khóa học này →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-wewin-navy">Advanced (Band 6.0 – 6.5+)</h4>
                    <span className="text-[11px] font-semibold text-emerald-700">Luyện đề thực chiến</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Giải đề full mock test thi thật, chỉnh sửa 1-1 các lỗi diễn đạt và phản xạ phòng thi để bứt phá band điểm.
                  </p>
                  <div className="mt-2">
                    <Link
                      href="/tests"
                      onClick={() => setShowRoadmapModal(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Luyện đề thi thật ngay →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowRoadmapModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <Link
                href="/tests"
                onClick={() => setShowRoadmapModal(false)}
                className="rounded-xl bg-wewin-navy px-4 py-2 text-xs font-semibold text-white hover:bg-wewin-navy-hover"
              >
                Kiểm tra trình độ miễn phí
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
