"use client";

import Link from "next/link";
import { GraduationCap, Lightbulb, Sprout, Video } from "lucide-react";
import { learnCatalogHref, learnGameHref } from "@/lib/learn/hrefs";
import {
  GAME_LEVELS,
  gameLevelsFor,
  type GameLevel,
  type GameLevelSummary,
  type PracticeGame,
} from "@/lib/learn/practice-games";
import { usePracticeGameCopy } from "@/components/learn/practice-game-copy";
import { useTranslations } from "@/i18n/provider";

const LEVEL_ICONS: Record<GameLevel, typeof Sprout | typeof Video> = {
  basic: Sprout,
  intermediate: GraduationCap,
  tedtalk: Video,
};

const LEVEL_THEMES: Record<
  GameLevel,
  {
    headerClass: string;
    iconBoxClass: string;
    borderHoverClass: string;
    countClass: string;
    ctaClass: string;
  }
> = {
  basic: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#06423b] to-[#047857]",
    iconBoxClass: "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-300/30",
    borderHoverClass: "hover:border-emerald-400/50",
    countClass: "text-emerald-100/90",
    ctaClass:
      "bg-emerald-50 border-emerald-200/70 text-emerald-800 group-hover:bg-[#06423b] group-hover:text-white group-hover:border-[#06423b]",
  },
  intermediate: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#0d2a6b] to-[#1e40af]",
    iconBoxClass: "bg-blue-400/20 text-blue-200 ring-1 ring-blue-300/30",
    borderHoverClass: "hover:border-blue-400/50",
    countClass: "text-blue-100/90",
    ctaClass:
      "bg-blue-50 border-blue-200/70 text-blue-800 group-hover:bg-[#001233] group-hover:text-white group-hover:border-[#001233]",
  },
  tedtalk: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#2c1259] to-[#6b21a8]",
    iconBoxClass: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30",
    borderHoverClass: "hover:border-purple-400/50",
    countClass: "text-purple-100/90",
    ctaClass:
      "bg-purple-50 border-purple-200/70 text-purple-800 group-hover:bg-[#2c1259] group-hover:text-white group-hover:border-[#2c1259]",
  },
};

type Props = { game: PracticeGame; levels: Record<GameLevel, GameLevelSummary> };

export function PracticeGameHub({ game, levels }: Props) {
  const { t } = useTranslations("practiceGames");
  const copy = usePracticeGameCopy(game);

  const levelCopy: Record<GameLevel, { title: string; desc: string }> = {
    basic: {
      title: t("levels.basic.title", "Trình độ Basic"),
      desc: t(
        "levels.basic.desc",
        "Đoạn audio ngắn, tốc độ chậm và từ vựng quen thuộc — phù hợp khi mới bắt đầu.",
      ),
    },
    intermediate: {
      title: t("levels.intermediate.title", "Trình độ Intermediate"),
      desc: t(
        "levels.intermediate.desc",
        "Đoạn dài hơn, hội thoại tự nhiên và tốc độ nói gần thực tế — nâng cao phản xạ nghe.",
      ),
    },
    tedtalk: {
      title: t("levels.tedtalk.title", "Video TED Talks"),
      desc: t(
        "levels.tedtalk.desc",
        "Luyện nói Shadowing qua các bài diễn thuyết TED Talks truyền cảm hứng từ các diễn giả hàng đầu.",
      ),
    },
  };

  const visibleLevels = gameLevelsFor(game).filter((level) => (levels[level]?.count ?? 0) > 0);

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={learnCatalogHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backLearn", "← Học")}
        </Link>
        <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">{copy.desc}</p>
      </header>

      <div className={`grid gap-4 sm:grid-cols-2 ${visibleLevels.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {visibleLevels.map((level) => {
          const Icon = LEVEL_ICONS[level];
          const { count: total, firstSlug } = levels[level] ?? { count: 0, firstSlug: null };
          const isTed = level === "tedtalk";
          const theme = LEVEL_THEMES[level] ?? LEVEL_THEMES.basic;
          return (
            <Link
              key={level}
              href={firstSlug ? learnGameHref(game, firstSlug) : learnGameHref(game)}
              className={`card-outline-hover group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${theme.borderHoverClass}`}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3.5 text-white ${theme.headerClass}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.iconBoxClass}`}
                >
                  <Icon className="h-5 w-5 opacity-95" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-base font-bold leading-tight">
                      {levelCopy[level].title}
                    </h2>
                    {isTed ? (
                      <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[10px] font-black uppercase text-slate-950 shadow-2xs">
                        HOT
                      </span>
                    ) : null}
                  </div>
                  <p className={`truncate text-xs mt-0.5 ${theme.countClass}`}>
                    {copy.title} · {t("lessonCount", { n: total }, `${total} bài`)}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 bg-white p-4">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-3">
                  {levelCopy[level].desc}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  {isTed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      <Video className="h-3 w-3" />
                      <span>30 Video HD</span>
                    </span>
                  ) : level === "basic" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <span>Cơ bản</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      <span>Trung cấp</span>
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${theme.ctaClass}`}
                  >
                    {t("openLevel", "Vào học →")}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {game === "shadowing" ? <ShadowingTips /> : null}
    </div>
  );
}

function ShadowingTips() {
  const { t } = useTranslations("practiceGames");
  return (
    <section
      aria-labelledby="shadowing-tips-heading"
      className="card-outline rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/90"
    >
      <h2
        id="shadowing-tips-heading"
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-wewin-navy"
      >
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        {t("shadowingTipsTitle", "Bí quyết luyện Shadowing hiệu quả")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
          <p className="text-xs font-bold text-wewin-navy">
            1. {t("tips.step1Title", "Nghe ngấm ngữ điệu")}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {t(
              "tips.step1Desc",
              "Nghe audio mẫu 1–2 lần ở tốc độ 1x hoặc 0.75x để nắm trọng âm và cách ngắt nghỉ tự nhiên.",
            )}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
          <p className="text-xs font-bold text-wewin-navy">
            2. {t("tips.step2Title", "Đọc đuổi theo audio")}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {t(
              "tips.step2Desc",
              "Nói đuổi theo giọng đọc ngay sau khoảng nửa giây, bắt chước khẩu hình, ngữ điệu và nối âm.",
            )}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
          <p className="text-xs font-bold text-wewin-navy">
            3. {t("tips.step3Title", "Đối chiếu và cải thiện")}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {t(
              "tips.step3Desc",
              "Ghi âm giọng của bạn, xem điểm đối chiếu và nghe lại để tìm những từ chưa rõ hoặc bị sót.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
