import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getGrammarCourseTopics } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import {
  grammarCourseLabel,
  isGrammarCourse,
  isRestrictedGrammarCourse,
  type GrammarCourse,
} from "@/lib/learn/vocab-grammar-types";
import { learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { coursePriceVnd } from "@/lib/learn/course-pricing";
import { getViewerRole } from "@/lib/auth";
import { canViewIeltsGrammar } from "@/lib/auth/roles";
import { SiteShell } from "@/components/layout/site-shell";
import { TopicCatalog } from "@/components/learn/topic-catalog";
import { GrammarCourseLocked } from "@/components/learn/grammar-course-tabs";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ course?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const { t } = await getTranslations();
  const raw = (await searchParams).course;
  const course: GrammarCourse = isGrammarCourse(raw) ? raw : "basic";
  if (course !== "basic") return { title: grammarCourseLabel(course, t) };
  return {
    title: `${t("learn.grammarTrack", "Ngữ pháp")} | ${t("learn.vocabGrammarCard", "Từ vựng và ngữ pháp")}`,
  };
}

export default async function GrammarCatalogPage({ searchParams }: Props) {
  const { t } = await getTranslations();
  const raw = (await searchParams).course;
  const course: GrammarCourse = isGrammarCourse(raw) ? raw : "basic";
  const isIeltsCourse = isRestrictedGrammarCourse(course);

  const role = isIeltsCourse ? await getViewerRole() : null;
  const locked = isIeltsCourse && !canViewIeltsGrammar(role);

  const ownerKey = await getLearnOwnerKey();
  const [progress, topics] = await Promise.all([
    getProgress(ownerKey),
    locked ? Promise.resolve([]) : getGrammarCourseTopics(course),
  ]);

  const loginHref = `/login?next=${encodeURIComponent(learnVocabGrammarTrackHref("grammar", course))}`;
  const priceVnd = locked ? coursePriceVnd(course) : null;
  const purchase = priceVnd
    ? {
        courseTitle: grammarCourseLabel(course, t),
        priceVnd,
        priceLabel: t("purchase.price", "Học phí"),
      }
    : undefined;

  return (
    <SiteShell active="learn" wide>
      <TopicCatalog
        track="grammar"
        trackLabel={isIeltsCourse ? grammarCourseLabel(course, t) : t("learn.grammarTrack", "Ngữ pháp")}
        parent={isIeltsCourse ? "catalog" : "vocab-grammar"}
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
        lockedPanel={
          locked ? (
            <GrammarCourseLocked
              title={t("learn.grammarCourseLockedTitle", "Khóa học dành cho học viên WeWIN")}
              description={
                role
                  ? t(
                      "learn.grammarCourseLockedVisitor",
                      "Tài khoản của bạn chưa thuộc lớp học nào. Liên hệ WeWIN để được thêm vào lớp và mở khóa học này.",
                    )
                  : t(
                      "learn.grammarCourseLockedGuest",
                      "Đăng nhập bằng tài khoản học viên WeWIN để xem khóa học này.",
                    )
              }
              cta={role ? undefined : { href: loginHref, label: t("learn.loginToView", "Đăng nhập") }}
              purchase={purchase}
            />
          ) : undefined
        }
      />
    </SiteShell>
  );
}
