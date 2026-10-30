"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Compass,
  Headphones,
  Mail,
  MapPin,
  Mic,
  Phone,
  Quote,
  Send,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";

const MASCOT_SRC = "/branding/wewin-mascot-hero.png";
const HONOR_SRC = "/branding/wewin-achievers-honor.jpg";
const LOGO_SRC = "/brand/wewin-logo.png";
const CONTACT_EMAIL = "officemanager@wewin.edu.vn";
const HOTLINES = ["0345 969 388", "037 866 9388"];

function StarDivider() {
  return (
    <div className="w-fit mx-auto py-8 lg:py-6 flex flex-col items-center">
      <div className="h-20 lg:h-32 w-0.5 bg-gradient-to-b from-transparent via-[#001233]/20 to-[#001233]/40" />
      <div className="p-1 rounded-full bg-white shadow-sm border border-slate-200 mt-2">
        <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
      </div>
    </div>
  );
}

/* =========================================================================
   1. HERO SECTION
   ========================================================================= */
function HeroSection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section
      id="hero-section"
      data-before="ABOUT US"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#A6BAFF] via-[#d6dff9] to-white before:content-[attr(data-before)] before:absolute before:top-[70px] md:before:top-[52px] before:left-0 before:w-full before:h-fit before:font-bold before:text-[clamp(60px,19.03vw,260px)] before:text-center before:leading-none before:whitespace-nowrap before:bg-clip-text before:text-transparent before:bg-[linear-gradient(180deg,#E2EEFF80_0%,#E2EEFF00_70%)] before:pointer-events-none"
    >
      <div className="mx-auto flex w-full max-w-[1366px] flex-col items-start gap-8 px-6 pb-16 pt-28 sm:pt-36 lg:pt-40 relative lg:min-h-[640px] lg:flex-row lg:items-center lg:px-20">
        <div className="max-w-[620px] lg:max-w-[540px] mx-auto lg:mx-0 z-10 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-[#001233] border border-[#001233]/10 shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" />
            {t("hero.badge", "Nền tảng IELTS Adaptive Learning")}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-[46px]/[56px] font-extrabold text-[#001233] tracking-tight">
            {t("hero.titleLine1", "Nền tảng Học và Luyện thi IELTS")}
            <span className="mt-2 block bg-gradient-to-r from-[#f0b136] to-[#f06036] bg-clip-text text-transparent">
              {t("hero.titleLine2", "thực chiến 4 kỹ năng")}
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-700 leading-relaxed font-normal">
            {t("hero.subtitle", "Kho đề Cambridge & Real Exam, giao diện thi máy chuẩn quốc tế, chấm điểm tức thì cùng bộ công cụ Chép chính tả và Shadowing độc quyền.")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-full bg-[#001233] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-[#001233]/25 hover:bg-[#00205b] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>{t("hero.ctaPrimary", "Bắt đầu học")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#001233] bg-white px-7 py-3 text-sm sm:text-base font-bold text-[#001233] hover:bg-zinc-50 hover:border-[#00205b] transition-all shadow-sm"
            >
              <span>{t("hero.ctaSecondary", "Thi thử miễn phí")}</span>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[480px] xl:max-w-[540px] lg:ml-auto z-10 flex justify-center">
          <div className="absolute inset-x-8 bottom-4 h-12 rounded-full bg-[#001233]/15 blur-2xl" />
          <Image
            src={MASCOT_SRC}
            alt={t("mascotAlt", "WeWIN Mascot Hero")}
            width={756}
            height={630}
            priority
            className="relative h-auto w-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   2. STORY SECTION
   ========================================================================= */
function StorySection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section id="story-section" className="px-4 pt-16 pb-12 relative overflow-hidden lg:px-10 lg:pt-24 xl:px-20 bg-white">
      <div className="mx-auto max-w-[1206px] text-center relative z-10">
        <p className="text-xl text-zinc-600 lg:text-2xl max-w-3xl mx-auto leading-relaxed">
          {t("story.lead", "Cùng một bài giảng, cùng một giáo trình, cùng một lớp học")}
          <br />
          <span className="font-bold text-[#001233]">
            {t("story.question", "Tại sao có những người nhanh chóng đạt mục tiêu nhưng cũng có người vẫn mãi loay hoay?")}
          </span>
        </p>

        <div className="mx-auto mt-8 max-w-[920px] rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-amber-50/50 border border-slate-200/80 p-6 sm:p-8 shadow-sm relative text-center">
          <Quote className="w-8 h-8 text-blue-300 absolute -top-4 left-6" />
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#001233] leading-snug">
            “{t("story.quote", "Mỗi người đều có điểm xuất phát, điểm mạnh, điểm yếu và tốc độ học tập khác nhau.")}”
          </p>
          <Quote className="w-8 h-8 text-amber-300 absolute -bottom-4 right-6 rotate-180" />
        </div>

        <StarDivider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1206px] mx-auto text-left mt-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-100/70 flex items-center justify-center text-blue-700 font-black text-lg mb-4">
              01
            </div>
            <h3 className="text-lg font-bold text-[#001233] mb-2">
              {t("story.steps.start", "Điểm xuất phát")}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("story.steps.startDesc", "Mỗi học viên có nền tảng từ vựng, ngữ pháp và phát âm ban đầu không giống nhau. Lộ trình học cần bắt đầu chính xác từ nơi bạn đang đứng.")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700 font-black text-lg mb-4">
              02
            </div>
            <h3 className="text-lg font-bold text-[#001233] mb-2">
              {t("story.steps.strength", "Điểm mạnh & Điểm yếu")}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("story.steps.strengthDesc", "Có bạn nghe tốt nhưng từ vựng yếu, có bạn đọc nhanh nhưng ngữ điệu phát âm chưa chuẩn. Cần tập trung thời gian cải thiện đúng điểm nghẽn.")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 font-black text-lg mb-4">
              03
            </div>
            <h3 className="text-lg font-bold text-[#001233] mb-2">
              {t("story.steps.pace", "Tốc độ học tập")}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("story.steps.paceDesc", "Khả năng tiếp thu, ghi nhớ và thời gian biểu của mỗi học viên hoàn toàn khác biệt. Hệ thống thông minh điều chỉnh nhịp độ tối ưu nhất.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   3. ADAPTIVE LEARNING SECTION
   ======================================================================== */
function AdaptiveSection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section id="adaptive-section" className="px-4 py-12 lg:px-20 lg:py-16 bg-slate-50/60">
      <div className="mx-auto max-w-[1254px] rounded-[36px] bg-gradient-to-br from-[#001233] via-[#092257] to-[#001233] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-[#f0b136]">
            <Sparkles className="w-4 h-4" />
            {t("platform.lead", "Đó là lý do WeWIN ra đời và được định vị là")}
          </span>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {t("platform.title", "Nền tảng IELTS Adaptive Learning")}{" "}
            <span className="bg-gradient-to-r from-[#f0b136] to-[#f06036] bg-clip-text text-transparent">
              {t("platform.titleSub", "đầu tiên tại Việt Nam")}
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {t("platform.desc", "Thay vì áp dụng một lộ trình cứng nhắc cho tất cả, WeWIN tự động chẩn đoán điểm mạnh - điểm yếu và liên tục cá nhân hóa bài tập luyện để bạn tiến bộ nhanh nhất trên từng kỹ năng.")}
          </p>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-white text-base">
                {t("adaptive.diagTitle", "Chẩn đoán thông minh")}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {t("adaptive.diagDesc", "Xác định chính xác lỗ hổng từ vựng, ngữ pháp và phát âm.")}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10">
              <Target className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="font-bold text-white text-base">
                {t("adaptive.customTitle", "Cá nhân hóa bài tập")}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {t("adaptive.customDesc", "Bài luyện được tinh chỉnh theo đúng tiến độ của bạn.")}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10">
              <Award className="w-6 h-6 text-blue-400 mb-2" />
              <h4 className="font-bold text-white text-base">
                {t("adaptive.timeTitle", "Tối ưu thời gian thi")}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {t("adaptive.timeDesc", "Nắm vững chiến thuật rút ngắn 50% thời gian làm bài.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   4. EXPERT & TECH SECTION
   ========================================================================= */
function ExpertSection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section id="expert-section" className="px-4 py-16 lg:px-20 lg:py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-[1254px]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full inline-block">
            {t("experts.badge", "Chất lượng chuyên môn & Công nghệ")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001233] leading-tight">
            {t("experts.heading", "Ứng dụng công nghệ để nhân bản tư duy của những bậc thầy xuất sắc nhất")}
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
            {t("experts.teamDesc", "Toàn bộ học liệu cùng bộ tiêu chí đánh giá tại WeWIN được xây dựng bởi các chuyên gia hàng đầu và cựu giám khảo IELTS. Bằng kinh nghiệm thực chiến, họ giúp bạn bóc tách các “điểm mù”, hình thành tư duy ngôn ngữ và trang bị chiến thuật tối ưu cho mọi dạng đề.")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Expert card */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 sm:p-10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="inline-flex p-3 rounded-2xl bg-[#001233] text-white mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#001233] mb-4">
                {t("experts.teamTitle", "Đội ngũ Chuyên gia kiến tạo chuẩn mực")}
              </h3>
              <ul className="space-y-3.5 text-zinc-700 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t("experts.exp1", "Giáo trình & bộ tiêu chí chấm điểm chuẩn khảo thí Cambridge và IDP.")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t("experts.exp2", "Phân tích chi tiết từng tiêu chí: Lexical Resource, Grammatical Range & Accuracy, Coherence & Task Response.")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t("experts.exp3", "Chiến thuật giải đề tinh gọn, tối ưu thời gian thao tác trên máy tính.")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t("experts.exp4", "Kho bài mẫu Speaking & Writing band 8.0 - 9.0 độc quyền.")}</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <Link
                href="/learn"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#001233] hover:text-blue-600 transition"
              >
                <span>{t("experts.exploreProgram", "Khám phá chương trình học 4 kỹ năng")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Technology card */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 sm:p-10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#001233] mb-4">
                {t("experts.techTitle", "Công nghệ cá nhân hóa trải nghiệm học tập")}
              </h3>
              <p className="text-zinc-600 text-sm sm:text-base mb-6 leading-relaxed">
                {t("experts.techDesc", "Kế thừa trọn vẹn tư duy của chuyên gia, hệ thống Adaptive Learning liên tục đo lường, theo sát và linh hoạt điều chỉnh lộ trình học tập phù hợp với năng lực thực tế của bạn ở mọi thời điểm.")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                  <BookOpenCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">
                    {t("experts.features.score", "Chấm điểm tức thì")}
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">
                    {t("experts.features.mock", "Gợi ý bài tập bù đắp")}
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                  <Headphones className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">
                    {t("experts.features.dictation", "Luyện nghe Chép chính tả")}
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                  <Mic className="w-5 h-5 text-purple-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">
                    {t("experts.features.shadowing", "Phản xạ phát âm Shadowing")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <Link
                href="/tests"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <span>{t("experts.exploreTests", "Trải nghiệm kho đề thi thực chiến")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   5. MISSION SECTION (WITH MARQUEE)
   ========================================================================= */
function MissionSection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section id="mission-section" className="bg-slate-50 relative py-20 lg:py-28 overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .wewin-marquee {
          display: flex;
          width: max-content;
          animation: marquee-scroll 35s linear infinite;
        }
        .wewin-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Marquee ticker background */}
      <div className="relative w-full overflow-hidden select-none opacity-40">
        <div className="wewin-marquee flex items-center gap-12">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-10 shrink-0">
              <span className="whitespace-nowrap text-6xl sm:text-8xl lg:text-[100px] leading-none font-black tracking-wider uppercase text-blue-900/15">
                {t("mission.ticker", "OUR MISSION")}
              </span>
              <Star className="w-8 h-8 text-blue-400/40 fill-blue-300/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Glassmorphic card overlay */}
      <div className="mx-auto max-w-[1216px] px-4 mt-8 relative z-10">
        <div className="rounded-2xl border-4 border-white bg-white/75 backdrop-blur-md p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:max-w-[430px] flex flex-col justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#001233] leading-snug">
              {t("mission.title", "Chinh phục IELTS không là “đặc quyền” của riêng ai")}
            </h2>
            <Image
              src={LOGO_SRC}
              alt={t("mascotAlt", "WeWIN Logo")}
              width={140}
              height={40}
              className="h-9 w-auto object-contain mt-2"
            />
          </div>

          <div className="w-full h-px lg:w-px lg:h-36 bg-slate-300" />

          <p className="flex-1 text-base sm:text-xl lg:text-2xl text-zinc-700 leading-relaxed">
            {t("mission.desc", "Sứ mệnh của chúng tôi là sử dụng Công nghệ & Phương pháp thực chiến để xoá nhòa mọi rào cản. Dù bạn ở đâu hay đang ở trình độ nào, WeWIN giúp bạn tiếp cận những Chuyên gia hàng đầu, chinh phục mục tiêu IELTS mọi lúc, mọi nơi, một cách hiệu quả và tiết kiệm nhất.")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   6. ACHIEVERS HALL OF FAME SECTION
   ========================================================================= */
function AchieversSection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section id="achievers-hall-of-fame" className="px-4 py-16 lg:px-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-[1254px]">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs sm:text-sm border border-amber-200">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            {t("honor.badge", "Bảng Vàng Vinh Danh")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001233] leading-tight">
            {t("honor.title", "Vinh danh học viên xuất sắc đạt điểm cao IELTS")}
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
            {t("honor.subtitle", "Minh chứng rõ ràng nhất cho hiệu quả của phương pháp học tập thực chiến tại WeWIN Education là hàng trăm học viên đã vượt mục tiêu band điểm 7.0 - 8.5 IELTS.")}
          </p>
        </div>

        {/* Framed banner image */}
        <div className="rounded-3xl border-4 border-slate-100 bg-slate-50 p-3 sm:p-5 shadow-xl overflow-hidden group">
          <div className="relative overflow-hidden rounded-2xl">
            <Image
              src={HONOR_SRC}
              alt={t("honor.imageAlt", "Bảng vàng học viên xuất sắc WeWIN IELTS")}
              width={1400}
              height={700}
              className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>

        {/* Stat badges */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">8.5 IELTS</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              {t("stats.highestBand", "Band điểm cao nhất")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">98%</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              {t("stats.targetReached", "Đạt và vượt mục tiêu")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">1.000+</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              {t("stats.trustedStudents", "Học viên tin tưởng")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-[#001233]">100%</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              {t("stats.standardTests", "Đề thi máy chuẩn quốc tế")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   7. JOURNEY CTA SECTION
   ========================================================================= */
function JourneySection() {
  const { t } = useTranslations("aboutPage");

  return (
    <section id="journey-section" className="px-4 py-12 lg:px-20 bg-slate-50">
      <div className="mx-auto max-w-[1254px] rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-[#001233] text-white p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl text-center md:text-left space-y-3 z-10">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-300">
            {t("journey.kicker", "Khởi đầu ngay hôm nay")}
          </span>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
            {t("journey.title", "Bạn đang ở đâu trên hành trình IELTS?")}
          </h3>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            {t("journey.desc", "Đừng để thời gian trôi qua trong mơ hồ. Hãy làm bài kiểm tra trình độ để nhận chẩn đoán chi tiết và lộ trình cá nhân hóa hoàn toàn miễn phí từ WeWIN.")}
          </p>
        </div>

        <div className="z-10 shrink-0">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm sm:text-base font-bold text-[#001233] shadow-lg hover:bg-amber-400 hover:text-[#001233] hover:scale-105 active:scale-95 transition-all"
          >
            <span>{t("journey.cta", "Kiểm tra trình độ miễn phí")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   8. SUPPORT FORM SECTION
   ========================================================================= */
function SupportFormSection() {
  const { t } = useTranslations("aboutPage");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseInterest, setCourseInterest] = useState("course");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName || !phone) return;
    setSubmitted(true);
  }

  return (
    <section id="support-form-section" className="py-16 md:py-24 bg-white scroll-mt-20">
      <div className="mx-auto w-full max-w-[1366px] px-6 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start justify-between">
          {/* Left: Form */}
          <div className="w-full lg:max-w-[720px]">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#001233] leading-tight">
              {t("contact.title", "Bạn cần hỗ trợ gì không?")}
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              {t("contact.subtitle", "Vui lòng để lại thông tin, đội ngũ WeWIN sẽ liên hệ tư vấn lộ trình học phù hợp nhất cho bạn hoàn toàn miễn phí.")}
            </p>

            {submitted ? (
              <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 sm:p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-xl font-bold text-emerald-900">
                  {t("contact.successTitle", "Đăng ký tư vấn thành công!")}
                </h4>
                <p className="text-sm text-emerald-700">
                  {t("contact.successDesc", { name: fullName, phone }, `Cảm ơn bạn ${fullName}! Chuyên viên tư vấn WeWIN sẽ liên hệ qua số điện thoại ${phone} trong thời gian sớm nhất.`)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      {t("contact.name", "Họ và tên")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      {t("contact.phone", "Số điện thoại")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      {t("contact.email", "Email")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                      {t("contact.interest", "Bạn quan tâm đến")} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={courseInterest}
                        onChange={(e) => setCourseInterest(e.target.value)}
                        className="w-full h-12 appearance-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option value="course">{t("contact.interests.course", "Khóa học IELTS 4 kỹ năng")}</option>
                        <option value="selfStudy">{t("contact.interests.selfStudy", "Gói luyện thi thực chiến")}</option>
                        <option value="placement">{t("contact.interests.placement", "Kiểm tra trình độ & Tư vấn lộ trình")}</option>
                        <option value="other">{t("contact.interests.other", "Yêu cầu khác")}</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">
                    {t("contact.notes", "Câu hỏi hoặc mục tiêu band điểm")}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("contact.notesPlaceholder", "Mục tiêu 6.5 - 7.5 IELTS, cần cải thiện Speaking & Writing...")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#001233] px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg hover:bg-blue-900 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t("contact.submit", "Đăng ký tư vấn ngay")}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Contact details + Mascot */}
          <div className="w-full lg:max-w-[420px] rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Image
                  src={MASCOT_SRC}
                  alt={t("mascotAlt", "WeWIN Support")}
                  width={90}
                  height={90}
                  className="h-20 w-auto object-contain"
                />
                <div>
                  <h4 className="font-bold text-lg text-[#001233]">
                    {t("contact.supportTitle", "WeWIN Education")}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    {t("contact.supportSubtitle", "Hỗ trợ học viên 24/7")}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-zinc-700">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {t("contact.hotline", "Hotline tư vấn:")}
                    </p>
                    <p>{HOTLINES.join(" / ")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-900">Email:</p>
                    <p>{CONTACT_EMAIL}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {t("contact.campus", "Cơ sở đào tạo:")}
                    </p>
                    <p className="mt-0.5">• {t("contact.campus1", "CS1: 292B Nơ Trang Long, P.12, Q. Bình Thạnh, TP.HCM")}</p>
                    <p className="mt-0.5">• {t("contact.campus2", "CS2: 742 Xô Viết Nghệ Tĩnh, P.25, Q. Bình Thạnh, TP.HCM")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-200">
              <p className="text-xs text-zinc-500">
                {t("contact.workingHours", "Giờ làm việc: Thứ 2 - Thứ 7: 8h00 - 21h00 | Chủ nhật: 8h00 - 17h30")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   9. LANDING FOOTER
   ========================================================================= */
function LandingFooter() {
  const { t } = useTranslations("aboutPage");

  return (
    <footer className="bg-[#001233] text-white rounded-t-[48px] overflow-hidden">
      <div className="max-w-[1366px] mx-auto px-6 md:px-20 py-12 md:py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16 lg:items-start">
          <div className="flex-1 flex flex-col gap-4 max-w-md">
            <Link href="/" className="inline-block">
              <Image
                src={LOGO_SRC}
                alt={t("mascotAlt", "WeWIN Logo")}
                width={140}
                height={40}
                className="h-9 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t("footer.aboutDesc", "WeWIN Education là nền tảng đào tạo và luyện thi IELTS thực chiến toàn diện 4 kỹ năng Listening, Reading, Writing và Speaking thông qua lộ trình cá nhân hóa Adaptive Learning và hệ thống đề thi chuẩn quốc tế.")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1">
            <div className="space-y-3">
              <h5 className="font-bold text-sm tracking-wider uppercase text-amber-400">
                {t("footer.explore", "Khám phá")}
              </h5>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/" className="hover:text-white transition">{t("footer.aboutWeWin", "Về WeWIN")}</Link></li>
                <li><Link href="/tests" className="hover:text-white transition">{t("footer.placementTest", "Kiểm tra trình độ")}</Link></li>
                <li><Link href="/learn" className="hover:text-white transition">{t("footer.learnSkills", "Học 4 kỹ năng")}</Link></li>
                <li><Link href="/tests" className="hover:text-white transition">{t("footer.mockTests", "Luyện đề thi thử")}</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-sm tracking-wider uppercase text-amber-400">
                {t("footer.features", "Tính năng")}
              </h5>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/learn" className="hover:text-white transition">{t("footer.dictation", "Chép chính tả")}</Link></li>
                <li><Link href="/learn" className="hover:text-white transition">{t("footer.shadowing", "Luyện nói Shadowing")}</Link></li>
                <li><Link href="/ranking" className="hover:text-white transition">{t("footer.ranking", "Bảng xếp hạng")}</Link></li>
                <li><a href="#achievers-hall-of-fame" className="hover:text-white transition">{t("footer.hallOfFame", "Bảng vàng vinh danh")}</a></li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h5 className="font-bold text-sm tracking-wider uppercase text-amber-400">
                {t("footer.contact", "Liên hệ")}
              </h5>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Hotline: 0345 969 388</li>
                <li>Email: {CONTACT_EMAIL}</li>
                <li>{t("footer.address", "Bình Thạnh, TP. Hồ Chí Minh")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{t("footer.copyright", { year: new Date().getFullYear() }, `© ${new Date().getFullYear()} WeWIN Education. Toàn bộ bản quyền được bảo lưu.`)}</p>
          <div className="flex gap-6">
            <Link href="/test-practice" className="hover:text-white transition">{t("footer.terms", "Điều khoản sử dụng")}</Link>
            <Link href="/test-practice" className="hover:text-white transition">{t("footer.privacy", "Chính sách bảo mật")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================================
   MAIN COMPONENT EXPORT
   ========================================================================= */
export function AboutLanding() {
  return (
    <div className="w-full bg-white">
      <HeroSection />
      <StorySection />
      <AdaptiveSection />
      <ExpertSection />
      <MissionSection />
      <AchieversSection />
      <JourneySection />
      <SupportFormSection />
      <LandingFooter />
    </div>
  );
}
