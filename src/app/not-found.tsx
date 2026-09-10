import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getTranslations("notFound");

  return (
    <SiteShell active="home">
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-wewin-navy">
          {t("code")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{t("title")}</h1>
        <p className="mt-3 text-sm text-zinc-600">{t("desc")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tests"
            className="rounded-lg bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t("viewTests")}
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
