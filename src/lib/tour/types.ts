export type TourId =
  | "home"
  | "learn"
  | "learn-course"
  | "learn-skill"
  | "tests"
  | "test-detail"
  | "ranking"
  | "attempts";

export type TourStep = {
  id: string;
  /** CSS selector, typically `[data-tour="…"]`. */
  target: string;
  /** Open the mobile sidebar / expand the rail so the target is visible. */
  sidebar?: boolean;
  titleKey: string;
  bodyKey: string;
};

export type TourDefinition = {
  id: TourId;
  steps: TourStep[];
};
