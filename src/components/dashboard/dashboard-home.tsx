"use client";

import type {
  HeroNext,
  IeltsSkill,
  RecommendedTest,
  SkillStatus,
} from "@/lib/dashboard-stats";
import type { RankingEntry } from "@/lib/ranking-shared";
import { HomeChallengesCard } from "@/components/dashboard/home-challenges-card";
import { HomeContactTeaser } from "@/components/dashboard/home-contact-teaser";
import { HomeContinueCard } from "@/components/dashboard/home-continue-card";
import { HomeGreetingBar } from "@/components/dashboard/home-greeting-bar";
import { HomeHero } from "@/components/dashboard/home-hero";
import { HomeRankingPreview } from "@/components/dashboard/home-ranking-preview";
import { HomeRecommendedTests } from "@/components/dashboard/home-recommended-tests";
import { HomeSkillsRow } from "@/components/dashboard/home-skills-row";
import { HomeStatsCard } from "@/components/dashboard/home-stats-card";
import { HomeStreakCard } from "@/components/dashboard/home-streak-card";

type Props = {
  dateLabel: string;
  greetingKey: "morning" | "afternoon" | "evening";
  givenName: string;
  loggedIn: boolean;
  hero: HeroNext;
  progress: {
    percent: number;
    finishedTests: number;
    totalTests: number;
    finishedAttempts: number;
    skillsTried: number;
    avgPercent: number | null;
  };
  streakDays: number;
  weekActive: boolean[];
  practicedToday: boolean;
  skills: { skill: IeltsSkill; status: SkillStatus; testCount: number }[];
  recommended: RecommendedTest[];
  rankingTop: RankingEntry[];
  rankPoints: number | null;
  rankPlace: number | null;
  intlLocale: string;
};

export function DashboardHome({
  dateLabel,
  greetingKey,
  givenName,
  loggedIn,
  hero,
  progress,
  streakDays,
  weekActive,
  practicedToday,
  skills,
  recommended,
  rankingTop,
  rankPoints,
  rankPlace,
  intlLocale,
}: Props) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div data-tour="home-greeting">
        <HomeGreetingBar
          dateLabel={dateLabel}
          greetingKey={greetingKey}
          givenName={givenName}
          progressPercent={progress.percent}
          streakDays={streakDays}
          rankPoints={rankPoints}
          rankPlace={rankPlace}
        />
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <div data-tour="home-hero">
            <HomeHero />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div data-tour="home-continue">
              <HomeContinueCard hero={hero} />
            </div>
            <HomeStatsCard
              progress={progress}
              rankPoints={rankPoints}
            />
          </div>

          <div data-tour="home-skills">
            <HomeSkillsRow skills={skills} />
          </div>
          <div data-tour="home-recommended">
            <HomeRecommendedTests tests={recommended} />
          </div>
        </div>

        <aside className="min-w-0 space-y-4 sm:space-y-5 lg:sticky lg:top-20">
          <HomeStreakCard
            streakDays={streakDays}
            weekActive={weekActive}
            loggedIn={loggedIn}
          />
          <HomeChallengesCard
            rankPoints={rankPoints ?? 0}
            streakDays={streakDays}
            practicedToday={practicedToday}
          />
          <HomeRankingPreview entries={rankingTop} intlLocale={intlLocale} />
          <HomeContactTeaser />
        </aside>
      </div>
    </div>
  );
}
