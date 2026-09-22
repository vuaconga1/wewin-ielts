import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { practicePath } from "@/lib/practice/paths";
import { listAttempts, listTests } from "@/lib/store/test-store";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslations, getLocale } from "@/i18n/server";
import { localeToIntl } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.attempts") };
}

export default async function AccountAttemptsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/account/attempts");
  }

  const { t } = await getTranslations();
  const locale = await getLocale();
  const intlLocale = localeToIntl(locale);

  const [attempts, tests] = await Promise.all([
    listAttempts({ userId: user.id }),
    listTests(),
  ]);
  const testBySlug = new Map(tests.map((t) => [t.slug, t]));

  const rows = attempts.map((a) => {
    const test = testBySlug.get(a.testSlug);
    return {
      attempt: a,
      title: test?.title ?? a.testSlug,
      skill: test?.skill,
    };
  });

  return (
    <SiteShell active="attempts">
      <div data-tour="attempts-header" className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-block text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("common.backHome")}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {user.email ?? user.username}
          <span className="text-zinc-400">
            {" "}
            · {user.role === "ADMIN" ? t("common.admin") : t("common.student")}
          </span>
        </p>
      </div>

      {rows.length === 0 ? (
        <div data-tour="attempts-list">
          <EmptyState
            icon="inbox"
            title={t("account.emptyTitle")}
            description={t("account.emptyDesc")}
            actionHref="/tests"
            actionLabel={t("account.emptyAction")}
          />
        </div>
      ) : (
        <div data-tour="attempts-list" className="card-outline overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-wewin-accent-blue-bg/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("common.testLabel")}</th>
                <th className="px-4 py-3">{t("common.mode")}</th>
                <th className="px-4 py-3">{t("common.score")}</th>
                <th className="px-4 py-3">{t("common.time")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ attempt, title, skill }) => (
                <tr key={attempt.id} className="border-t border-zinc-200">
                  <td className="max-w-[14rem] px-4 py-3 sm:max-w-none">
                    <div className="break-words font-medium text-zinc-900">
                      {title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {skill ? t(`skills.${skill}`) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t(`attemptModes.${attempt.mode}`, attempt.mode)}
                  </td>
                  <td className="px-4 py-3">
                    {attempt.score
                      ? `${attempt.score.correct}/${attempt.score.total} (${attempt.score.percent}%)`
                      : attempt.finishedAt
                        ? t("common.dash")
                        : t("common.inProgress")}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(attempt.startedAt).toLocaleString(intlLocale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={practicePath(
                        attempt.testSlug,
                        attempt.id,
                        Boolean(attempt.finishedAt),
                      )}
                      className="font-medium text-wewin-navy hover:underline"
                    >
                      {attempt.finishedAt ? t("common.result") : t("common.continue")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SiteShell>
  );
}
