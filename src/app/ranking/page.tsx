import { getSessionUser } from "@/lib/auth";
import { SiteShell } from "@/components/layout/site-shell";
import { RankingBoard } from "@/components/ranking/ranking-board";
import { getRanking } from "@/lib/ranking";
import { getTranslations, getLocale } from "@/i18n/server";
import { localeToIntl } from "@/i18n/config";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  period?: string;
  year?: string;
  month?: string;
  day?: string;
}>;

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.ranking") };
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const locale = await getLocale();
  const intlLocale = localeToIntl(locale);

  const data = await getRanking({
    period: params.period,
    year: params.year,
    month: params.month,
    day: params.day,
    currentUserId: user?.id ?? null,
  });

  return (
    <SiteShell active="ranking">
      <RankingBoard
        data={data}
        intlLocale={intlLocale}
        isLoggedIn={Boolean(user)}
      />
    </SiteShell>
  );
}
