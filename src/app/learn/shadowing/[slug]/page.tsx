import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { ShadowingPractice } from "@/components/shadowing/shadowing-practice";
import { getPublicShadowing } from "@/lib/shadowing/store";
import { getTranslationsStatic } from "@/i18n/server";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { t } = getTranslationsStatic();
  const exercise = await getPublicShadowing(slug);
  return {
    title: exercise ? `${exercise.title} | ${t("meta.shadowing")}` : t("meta.shadowing"),
  };
}

export default async function ShadowingExercisePage({ params }: Props) {
  const { slug } = await params;
  const exercise = await getPublicShadowing(slug);
  if (!exercise) notFound();
  return (
    <SiteShell active="learn">
      <ShadowingPractice exercise={exercise} />
    </SiteShell>
  );
}
