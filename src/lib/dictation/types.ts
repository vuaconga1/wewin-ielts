export type DictationScoringMode = "LEARNING";

export type DictationMode = "FULL_TEXT" | "FILL_BLANK";

/** Token indices refer to whitespace-separated chunks of the transcript; endToken is exclusive. */
export type FillBlankGap = {
  id: string;
  startToken: number;
  endToken: number;
  acceptedAnswers?: string[];
};

/** Learner-visible transcript piece before submit; never carries the answer. */
export type FillBlankSegment =
  | { type: "text"; text: string }
  | { type: "gap"; id: string; index: number };

export type FillBlankGapStatus = "correct" | "incorrect" | "blank";

export type FillBlankGapResult = {
  gapId: string;
  submitted: string;
  expected: string;
  status: FillBlankGapStatus;
};

export type FillBlankResultSegment =
  | { type: "text"; text: string }
  | { type: "gap"; index: number; result: FillBlankGapResult };

export type FillBlankGrade = {
  score: number;
  correctCount: number;
  totalGaps: number;
  gapResults: FillBlankGapResult[];
};

export type DictationSettings = {
  /** null = unlimited plays */
  maxListenCount: number | null;
  playbackRates: number[];
  scoringMode: DictationScoringMode;
};

export const DEFAULT_DICTATION_SETTINGS: DictationSettings = {
  maxListenCount: null,
  playbackRates: [0.75, 1],
  scoringMode: "LEARNING",
};

export type DictationWordStatus = "correct" | "incorrect" | "missing" | "extra";

export type DictationWordResult =
  | { status: "correct"; expected: string; actual: string }
  | { status: "incorrect"; expected: string; actual: string; nearMiss: boolean }
  | { status: "missing"; expected: string }
  | { status: "extra"; actual: string };

export type DictationErrorSummary = {
  missing: string[];
  incorrect: { expected: string; actual: string }[];
  extra: string[];
};

export type DictationGrade = {
  score: number;
  correctCount: number;
  totalWords: number;
  normalizedText: string;
  wordResults: DictationWordResult[];
  errorSummary: DictationErrorSummary;
};

/** Safe for the browser before submit — never includes the transcript. */
export type PublicDictationExercise = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  instructions: string | null;
  audioUrl: string;
  settings: DictationSettings;
  mode: DictationMode;
  /** FILL_BLANK only: transcript with gaps replaced by input slots. */
  segments: FillBlankSegment[] | null;
};

export type DictationCatalogItem = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  mode: DictationMode;
};

export type DictationSubmitResult = DictationGrade & {
  mode: "FULL_TEXT";
  attemptId: string;
  listenCount: number;
  durationSeconds: number;
  transcript: string;
};

export type FillBlankSubmitResult = FillBlankGrade & {
  mode: "FILL_BLANK";
  attemptId: string;
  listenCount: number;
  durationSeconds: number;
  transcript: string;
  /** null when the exercise was edited after this attempt and gaps no longer line up. */
  segments: FillBlankResultSegment[] | null;
};

export type DictationHistoryItem = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalWords: number;
  durationSeconds: number;
  completedAt: string;
};

export type DictationAttemptReview =
  | (DictationSubmitResult & { submittedText: string; completedAt: string })
  | (FillBlankSubmitResult & { completedAt: string });
