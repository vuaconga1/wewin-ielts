import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.forbidden") };
}

type Props = {
  searchParams: Promise<{ from?: string }>;
};

export default async function ForbiddenPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const isAdminArea = from === "admin";
  const { t } = await getTranslations("forbidden");

  return (
    <SiteShell>
      <div className="wewin-card-3d mx-auto max-w-lg rounded-2xl px-6 py-10 text-center sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
          {t("code")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          {isAdminArea ? t("adminTitle") : t("genericTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {isAdminArea ? t("adminDesc") : t("genericDesc")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t("home")}
          </Link>
          <Link
            href="/learn"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            {t("learn")}
          </Link>
          <Link
            href="/tests"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            {t("tests")}
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
