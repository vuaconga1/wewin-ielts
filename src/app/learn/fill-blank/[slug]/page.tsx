import { notFound, permanentRedirect } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationPlayer } from "@/components/dictation/dictation-player";
import { getPublicDictation } from "@/lib/dictation/store";
import { learnDictationHref } from "@/lib/learn/hrefs";
import { getTranslationsStatic } from "@/i18n/server";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { t } = getTranslationsStatic();
  const exercise = await getPublicDictation(slug);
  return {
    title: exercise ? `${exercise.title} | ${t("meta.fillBlank")}` : t("meta.fillBlank"),
  };
}

export default async function FillBlankExercisePage({ params }: Props) {
  const { slug } = await params;
  const exercise = await getPublicDictation(slug);
  if (!exercise) notFound();
  if (exercise.mode !== "FILL_BLANK") permanentRedirect(learnDictationHref(slug));
  return (
    <SiteShell active="learn">
      <DictationPlayer exercise={exercise} />
    </SiteShell>
  );
}
