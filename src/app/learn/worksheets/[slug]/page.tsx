import { notFound } from "next/navigation";
import { getWorksheetBySlug, getWorksheetsCatalog } from "@/lib/learn/worksheets-store";
import { SiteShell } from "@/components/layout/site-shell";
import { WorksheetPlayer } from "@/components/learn/worksheets/worksheet-player";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const worksheets = await getWorksheetsCatalog();
  return worksheets.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const lesson = await getWorksheetBySlug(slug);
  if (!lesson) {
    return { title: "Không tìm thấy bài học | WeWIN IELTS" };
  }
  return {
    title: `${lesson.title}: ${lesson.subject} | WeWIN IELTS`,
    description: lesson.subjectVi,
  };
}

export default async function WorksheetDetailPage({ params }: Props) {
  const { slug } = await params;
  const lesson = await getWorksheetBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <SiteShell active="learn">
      <WorksheetPlayer lesson={lesson} />
    </SiteShell>
  );
}

