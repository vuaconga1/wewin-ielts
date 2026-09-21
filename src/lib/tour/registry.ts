import type { TourDefinition, TourId, TourStep } from "./types";
import { isExamTypeModulePath } from "@/lib/tests/exam-type";

const HOME: TourStep[] = [
  {
    id: "profile",
    target: '[data-tour="home-profile"]',
    sidebar: true,
    titleKey: "home.profileTitle",
    bodyKey: "home.profileBody",
  },
  {
    id: "nav",
    target: '[data-tour="nav"]',
    sidebar: true,
    titleKey: "home.navTitle",
    bodyKey: "home.navBody",
  },
  {
    id: "greeting",
    target: '[data-tour="home-greeting"]',
    titleKey: "home.greetingTitle",
    bodyKey: "home.greetingBody",
  },
  {
    id: "hero",
    target: '[data-tour="home-hero"]',
    titleKey: "home.heroTitle",
    bodyKey: "home.heroBody",
  },
  {
    id: "continue",
    target: '[data-tour="home-continue"]',
    titleKey: "home.continueTitle",
    bodyKey: "home.continueBody",
  },
  {
    id: "skills",
    target: '[data-tour="home-skills"]',
    titleKey: "home.skillsTitle",
    bodyKey: "home.skillsBody",
  },
  {
    id: "recommended",
    target: '[data-tour="home-recommended"]',
    titleKey: "home.recommendedTitle",
    bodyKey: "home.recommendedBody",
  },
];

const LEARN: TourStep[] = [
  {
    id: "header",
    target: '[data-tour="learn-header"]',
    titleKey: "learn.headerTitle",
    bodyKey: "learn.headerBody",
  },
  {
    id: "courses",
    target: '[data-tour="learn-courses"]',
    titleKey: "learn.coursesTitle",
    bodyKey: "learn.coursesBody",
  },
  {
    id: "nav",
    target: '[data-tour="nav"]',
    sidebar: true,
    titleKey: "learn.navTitle",
    bodyKey: "learn.navBody",
  },
];

const LEARN_COURSE: TourStep[] = [
  {
    id: "header",
    target: '[data-tour="learn-course-header"]',
    titleKey: "learnCourse.headerTitle",
    bodyKey: "learnCourse.headerBody",
  },
  {
    id: "progress",
    target: '[data-tour="learn-course-progress"]',
    titleKey: "learnCourse.progressTitle",
    bodyKey: "learnCourse.progressBody",
  },
  {
    id: "skills",
    target: '[data-tour="learn-course-skills"]',
    titleKey: "learnCourse.skillsTitle",
    bodyKey: "learnCourse.skillsBody",
  },
];

const LEARN_SKILL: TourStep[] = [
  {
    id: "header",
    target: '[data-tour="learn-skill-header"]',
    titleKey: "learnSkill.headerTitle",
    bodyKey: "learnSkill.headerBody",
  },
  {
    id: "progress",
    target: '[data-tour="learn-skill-progress"]',
    titleKey: "learnSkill.progressTitle",
    bodyKey: "learnSkill.progressBody",
  },
  {
    id: "lessons",
    target: '[data-tour="learn-skill-lessons"]',
    titleKey: "learnSkill.lessonsTitle",
    bodyKey: "learnSkill.lessonsBody",
  },
];

const TESTS: TourStep[] = [
  {
    id: "header",
    target: '[data-tour="tests-header"]',
    titleKey: "tests.headerTitle",
    bodyKey: "tests.headerBody",
  },
  {
    id: "modules",
    target: '[data-tour="tests-modules"]',
    titleKey: "tests.modulesTitle",
    bodyKey: "tests.modulesBody",
  },
  {
    id: "filters",
    target: '[data-tour="tests-filters"]',
    titleKey: "tests.filtersTitle",
    bodyKey: "tests.filtersBody",
  },
  {
    id: "catalog",
    target: '[data-tour="tests-catalog"]',
    titleKey: "tests.catalogTitle",
    bodyKey: "tests.catalogBody",
  },
];

const TEST_DETAIL: TourStep[] = [
  {
    id: "info",
    target: '[data-tour="test-detail-info"]',
    titleKey: "testDetail.infoTitle",
    bodyKey: "testDetail.infoBody",
  },
  {
    id: "start",
    target: '[data-tour="test-detail-start"]',
    titleKey: "testDetail.startTitle",
    bodyKey: "testDetail.startBody",
  },
  {
    id: "history",
    target: '[data-tour="test-detail-history"]',
    titleKey: "testDetail.historyTitle",
    bodyKey: "testDetail.historyBody",
  },
];

const RANKING: TourStep[] = [
  {
    id: "header",
    target: '[data-tour="ranking-header"]',
    titleKey: "ranking.headerTitle",
    bodyKey: "ranking.headerBody",
  },
  {
    id: "podium",
    target: '[data-tour="ranking-podium"]',
    titleKey: "ranking.podiumTitle",
    bodyKey: "ranking.podiumBody",
  },
  {
    id: "you",
    target: '[data-tour="ranking-you"]',
    titleKey: "ranking.youTitle",
    bodyKey: "ranking.youBody",
  },
];

const ATTEMPTS: TourStep[] = [
  {
    id: "header",
    target: '[data-tour="attempts-header"]',
    titleKey: "attempts.headerTitle",
    bodyKey: "attempts.headerBody",
  },
  {
    id: "list",
    target: '[data-tour="attempts-list"]',
    titleKey: "attempts.listTitle",
    bodyKey: "attempts.listBody",
  },
];

const TOURS: Record<TourId, TourDefinition> = {
  home: { id: "home", steps: HOME },
  learn: { id: "learn", steps: LEARN },
  "learn-course": { id: "learn-course", steps: LEARN_COURSE },
  "learn-skill": { id: "learn-skill", steps: LEARN_SKILL },
  tests: { id: "tests", steps: TESTS },
  "test-detail": { id: "test-detail", steps: TEST_DETAIL },
  ranking: { id: "ranking", steps: RANKING },
  attempts: { id: "attempts", steps: ATTEMPTS },
};

const SKIP_PREFIXES = ["/admin", "/practice", "/login", "/forbidden"];

export function matchTourId(pathname: string): TourId | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return null;
  }
  if (path === "/") return "home";
  if (path === "/learn") return "learn";
  if (path === "/tests" || isExamTypeModulePath(path)) return "tests";
  if (path === "/ranking") return "ranking";
  if (path === "/account/attempts") return "attempts";

  // Vocab/grammar is a sibling of course hubs — skip 4-skills tours there.
  if (path === "/learn/vocab-grammar" || path.startsWith("/learn/vocab-grammar/")) {
    return null;
  }

  const learnLesson = path.match(/^\/learn\/[^/]+\/[^/]+\/[^/]+$/);
  if (learnLesson) return null;

  const learnSkill = path.match(/^\/learn\/[^/]+\/[^/]+$/);
  if (learnSkill) return "learn-skill";

  const learnCourse = path.match(/^\/learn\/[^/]+$/);
  if (learnCourse) return "learn-course";

  const testDetail = path.match(/^\/tests\/[^/]+$/);
  if (testDetail && !isExamTypeModulePath(path)) return "test-detail";

  return null;
}

export function getTour(id: TourId | null | undefined): TourDefinition | null {
  if (!id) return null;
  return TOURS[id] ?? null;
}
