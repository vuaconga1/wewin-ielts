import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getGrammarCourseTopics } from "@/lib/learn/vocab-grammar-store";
import { toPublicTopicMeta } from "@/lib/learn/vocab-grammar-public";
import {
  isGrammarCourse,
  isRestrictedGrammarCourse,
  type GrammarCourse,
} from "@/lib/learn/vocab-grammar-types";
import { learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { getViewerRole } from "@/lib/auth";
import { canViewIeltsGrammar } from "@/lib/auth/roles";
import { SiteShell } from "@/components/layout/site-shell";
import { TopicCatalog } from "@/components/learn/topic-catalog";
import { GrammarCourseLocked, GrammarCourseTabs } from "@/components/learn/grammar-course-tabs";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ course?: string | string[] }>;
};

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: `${t("learn.grammarTrack", "Ngữ pháp")} | ${t("learn.vocabGrammarCard", "Từ vựng và ngữ pháp")}`,
  };
}

export default async function GrammarCatalogPage({ searchParams }: Props) {
  const { t } = await getTranslations();
  const raw = (await searchParams).course;
  const course: GrammarCourse = isGrammarCourse(raw) ? raw : "basic";

  const role = await getViewerRole();
  const ieltsLocked = !canViewIeltsGrammar(role);
  const locked = isRestrictedGrammarCourse(course) && ieltsLocked;

  const ownerKey = await getLearnOwnerKey();
  const [progress, topics] = await Promise.all([
    getProgress(ownerKey),
    locked ? Promise.resolve([]) : getGrammarCourseTopics(course),
  ]);

  const labels: Record<GrammarCourse, string> = {
    basic: t("learn.grammarCourseBasic", "Ngữ pháp cơ bản"),
    "ielts-3-4": t("learn.grammarCourseIelts34", "Ngữ pháp IELTS 3.0–4.0"),
    "ielts-4-5": t("learn.grammarCourseIelts45", "Ngữ pháp IELTS 4.0–5.0"),
  };
  const loginHref = `/login?next=${encodeURIComponent(learnVocabGrammarTrackHref("grammar", course))}`;

  return (
    <SiteShell active="learn" wide>
      <TopicCatalog
        track="grammar"
        trackLabel={t("learn.grammarTrack", "Ngữ pháp")}
        topics={topics.map(toPublicTopicMeta)}
        progress={progress}
        toolbar={
          <GrammarCourseTabs
            active={course}
            labels={labels}
            locked={{ "ielts-3-4": ieltsLocked, "ielts-4-5": ieltsLocked }}
            lockedLabel={t("learn.locked", "Đã khóa")}
          
          />
        }
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
            />
          ) : undefined
        }
      />
    </SiteShell>
  );
}
