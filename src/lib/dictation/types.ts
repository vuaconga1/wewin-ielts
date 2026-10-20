export type DictationScoringMode = "LEARNING";

export type DictationMode = "FULL_TEXT" | "FILL_BLANK" | "QUESTION_ANSWER";

/**
 * KEYWORD: correct when the answer contains an accepted phrase as whole words
 * ("James took out the trash" contains "took out the trash").
 * EXACT: the whole answer must equal an accepted phrase after normalisation.
 */
export type ListenQuestionMatch = "KEYWORD" | "EXACT";

export type ListenQuestion = {
  id: string;
  prompt: string;
  /** Accepted answers / keyword phrases; the first one is shown as the model answer. */
  answers: string[];
  match: ListenQuestionMatch;
  /** Wrong options (e.g. the other name in "Kathy or James?"); mentioning one marks the answer wrong. */
  rejectAnswers?: string[];
  maxWords?: number;
};

/** Learner-visible question before submit; never carries the answers. */
export type PublicListenQuestion = {
  id: string;
  index: number;
  prompt: string;
  maxWords: number | null;
};

export type ListenQuestionStatus = "correct" | "incorrect" | "blank";

/** Why a non-blank answer was marked wrong when it is not a plain mismatch. */
export type ListenQuestionReason = "TOO_MANY_WORDS" | "WRONG_OPTION" | "NEGATED";

export type ListenQuestionResult = {
  questionId: string;
  /** Snapshot so reviews still read correctly after the exercise is edited. */
  prompt: string;
  submitted: string;
  expected: string;
  status: ListenQuestionStatus;
  reason?: ListenQuestionReason;
};

export type ListenAnswerGrade = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  questionResults: ListenQuestionResult[];
};

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
  /** QUESTION_ANSWER only: questions without their answers. */
  questions: PublicListenQuestion[] | null;
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

export type ListenAnswerSubmitResult = ListenAnswerGrade & {
  mode: "QUESTION_ANSWER";
  attemptId: string;
  listenCount: number;
  durationSeconds: number;
  transcript: string;
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
  | (FillBlankSubmitResult & { completedAt: string })
  | (ListenAnswerSubmitResult & { completedAt: string });
