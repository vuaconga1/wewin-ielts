import { notFound } from "next/navigation";
import { TestDetailView } from "@/components/tests/test-detail-view";
import { getSessionUser } from "@/lib/auth";
import { getTestBySlug, listAttempts } from "@/lib/store/test-store";
import { examTypeModulePath, normalizeExamType } from "@/lib/tests/exam-type";
import { SiteShell } from "@/components/layout/site-shell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  return { title: test ? `${test.title} | Wewin IELTS` : "Đề thi" };
}

export default async function TestDetailPage({ params }: Props) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) notFound();

  const user = await getSessionUser();
  const attempts = user
    ? (await listAttempts({ userId: user.id })).filter(
        (a) => a.testSlug === test.slug,
      )
    : [];

  const qCount = test.parts.reduce((s, p) => s + p.questions.length, 0);

  return (
    <SiteShell active="tests">
      <TestDetailView
        slug={test.slug}
        title={test.title}
        skill={test.skill}
        examType={normalizeExamType(test.examType)}
        backHref={examTypeModulePath(test.examType)}
        tags={test.tags ?? []}
        timeLimitMinutes={test.timeLimitMinutes ?? null}
        qCount={qCount}
        description={test.description}
        isLoggedIn={Boolean(user)}
        attempts={attempts.map((a) => ({
          id: a.id,
          mode: a.mode,
          sectionOrders: a.sectionOrders,
          speakingPartKinds: a.speakingPartKinds,
          startedAt: a.startedAt,
          finishedAt: a.finishedAt,
          timeLimitMinutes: a.timeLimitMinutes,
          score: a.score
            ? { correct: a.score.correct, total: a.score.total }
            : null,
        }))}
        parts={test.parts.map((p) => ({
          title: p.title,
          order: p.order,
          content: p.content,
          questions: p.questions.map((q) => ({
            number: q.number,
            type: q.type,
            content: q.content as {
              stem?: string;
              speakingPart?: 1 | 2 | 3;
              topic?: string;
            },
          })),
        }))}
      />
    </SiteShell>
  );
}
