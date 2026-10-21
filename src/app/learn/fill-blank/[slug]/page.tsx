import { notFound, permanentRedirect } from "next/navigation";
import { PracticeGameExerciseFrame } from "@/components/learn/practice-game-pages";
import { DictationPlayer } from "@/components/dictation/dictation-player";
import { getPublicDictation } from "@/lib/dictation/store";
import { learnListeningExerciseHref } from "@/lib/learn/hrefs";
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
  if (exercise.mode !== "FILL_BLANK") permanentRedirect(learnListeningExerciseHref(exercise.mode, slug));
  return (
    <PracticeGameExerciseFrame game="fill-blank" exercise={exercise}>
      <DictationPlayer key={exercise.slug} exercise={exercise} />
    </PracticeGameExerciseFrame>
  );
}
