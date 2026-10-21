import { notFound } from "next/navigation";
import { PracticeGameExerciseFrame } from "@/components/learn/practice-game-pages";
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
    <PracticeGameExerciseFrame game="shadowing" exercise={exercise}>
      <ShadowingPractice key={exercise.slug} exercise={exercise} />
    </PracticeGameExerciseFrame>
  );
}
