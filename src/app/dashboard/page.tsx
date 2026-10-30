import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { getUserDisplayProfile } from "@/lib/user-profile";
import { listAttempts, listPublicTests } from "@/lib/store/test-store";
import { SiteShell } from "@/components/layout/site-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import {
  computeProgress,
  computeSkillStatuses,
  computeStreak,
  dateKey,
  displayGivenName,
  formatGreetingDate,
  greetingKey,
  pickHero,
  pickRecommendedTests,
} from "@/lib/dashboard-stats";
import { getRanking } from "@/lib/ranking";
import { getLocale } from "@/i18n/server";
import { localeToIntl } from "@/i18n/config";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard - Không gian học tập | WEWIN Education",
  description: "Theo dõi tiến độ học tập, chuỗi ngày luyện thi, bảng xếp hạng và các bài thi IELTS gợi ý.",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  const locale = await getLocale();
  const intlLocale = localeToIntl(locale);
  const { t } = await getTranslations();

  const tests = await listPublicTests();
  const attempts = user ? await listAttempts({ userId: user.id }) : [];

  const hero = pickHero(tests, attempts);
  const progress = computeProgress(tests, attempts);
  const streak = computeStreak(attempts);
  const skills = computeSkillStatuses(tests, attempts);
  const recommended = pickRecommendedTests(tests, attempts, 4);

  const ranking = await getRanking({
    period: "month",
    currentUserId: user?.id ?? null,
  });

  const todayKey = dateKey(new Date().toISOString());
  const practicedToday = attempts.some(
    (a) => dateKey(a.finishedAt ?? a.updatedAt ?? a.startedAt) === todayKey,
  );

  let displayName = user?.fullName;
  if (!displayName && user?.id) {
    const profile = await getUserDisplayProfile(user.id);
    displayName = profile?.fullName ?? null;
  }

  // Ưu tiên hiển thị tên học viên (fullName) thay vì mã học viên (username)
  const givenName = displayName?.trim()
    ? displayName.trim()
    : user
    ? displayGivenName(user.username)
    : t("common.you");

  return (
    <SiteShell active="home">
      <DashboardHome
        dateLabel={formatGreetingDate(new Date(), intlLocale)}
        greetingKey={greetingKey()}
        givenName={givenName}
        loggedIn={Boolean(user)}
        hero={hero}
        progress={progress}
        streakDays={streak.days}
        weekActive={streak.weekActive}
        practicedToday={practicedToday}
        skills={skills}
        recommended={recommended}
        rankingTop={ranking.entries.slice(0, 3)}
        rankPoints={ranking.currentUser?.points ?? null}
        rankPlace={ranking.currentUser?.rank ?? null}
        intlLocale={intlLocale}
      />
    </SiteShell>
  );
}

