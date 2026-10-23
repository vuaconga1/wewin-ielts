import { notFound } from "next/navigation";
import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getGrammarCourseTopics, getTopicBySlug } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopic, toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import {
  isRestrictedGrammarCourse,
  pickLocalized,
  topicCourse,
} from "@/lib/learn/vocab-grammar-types";
import { learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { getViewerRole } from "@/lib/auth";
import { canViewIeltsGrammar } from "@/lib/auth/roles";
import { SiteShell } from "@/components/layout/site-shell";
import { TopicLessonPlayer } from "@/components/learn/topic-lesson-player";
import { GrammarCourseLocked } from "@/components/learn/grammar-course-tabs";
import { getLocale, getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ topicSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug } = await params;
  const locale = await getLocale();
  const { t } = await getTranslations();
  const topic = await getTopicBySlug("grammar", topicSlug);
  if (!topic) return { title: t("meta.learn") };
  return {
    title: `${pickLocalized(topic.title, locale)} | ${t("learn.grammarTrack", "Ngữ pháp")}`,
  };
}

export default async function GrammarTopicPage({ params }: Props) {
  const { topicSlug } = await params;

  const topic = await getTopicBySlug("grammar", topicSlug);
  if (!topic) notFound();

  const locale = await getLocale();
  const { t } = await getTranslations();
  const course = topicCourse(topic);

  if (isRestrictedGrammarCourse(course)) {
    const role = await getViewerRole();
    if (!canViewIeltsGrammar(role)) {
      const courseHref = learnVocabGrammarTrackHref("grammar", course);
      return (
        <SiteShell active="learn" wide>
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
            cta={
              role
                ? { href: learnVocabGrammarTrackHref("grammar"), label: t("learn.backCurriculum") }
                : {
                    href: `/login?next=${encodeURIComponent(courseHref)}`,
                    label: t("learn.loginToView", "Đăng nhập"),
                  }
            }
          />
        </SiteShell>
      );
    }
  }

  const ownerKey = await getLearnOwnerKey();
  const [progress, topics] = await Promise.all([
    getProgress(ownerKey),
    getGrammarCourseTopics(course),
  ]);
  const ordered = [...topics].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((tpc) => tpc.slug === topicSlug);
  const prev = idx > 0 ? ordered[idx - 1] : undefined;
  const next = idx >= 0 ? ordered[idx + 1] : undefined;
  const courseLabel =
    course === "ielts-3-4"
      ? t("learn.grammarCourseIelts34", "Ngữ pháp IELTS 3.0–4.0")
      : course === "ielts-4-5"
        ? t("learn.grammarCourseIelts45", "Ngữ pháp IELTS 4.0–5.0")
        : t("learn.grammarCourseBasic", "Ngữ pháp cơ bản");

  return (
    <SiteShell active="learn" wide fitScreen noFooter>
      <TopicLessonPlayer
        track="grammar"
        course={course}
        moduleTitle={courseLabel}
        trackLabel={courseLabel}
        topic={toPublicTopic(topic)}
        displayTitle={pickLocalized(topic.title, locale)}
        displaySummary={pickLocalized(topic.summary, locale)}
        theoryHtml={pickLocalized(topic.theoryHtml, locale)}
        slidesHtml={
          topic.slidesHtml ? pickLocalized(topic.slidesHtml, locale) : undefined
        }
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
        prevSlug={prev?.slug ?? null}
        nextSlug={next?.slug ?? null}
        nextTitle={next ? pickLocalized(next.title, locale) : null}
      />
    </SiteShell>
  );
}
