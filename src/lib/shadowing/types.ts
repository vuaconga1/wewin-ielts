import type { DictationErrorSummary, DictationWordResult } from "@/lib/dictation/types";

export type ShadowingWordResult = DictationWordResult;
export type ShadowingErrorSummary = DictationErrorSummary;

/** Identifies which speech-to-text backend produced the recognized text. */
export type SttProviderId = "web-speech";

export const DEFAULT_MAX_RECORD_SECONDS = 30;
export const MIN_RECORD_SECONDS = 5;
export const MAX_RECORD_SECONDS = 120;

export type ShadowingGrade = {
  /** Content match 0–100 = max(0, 100 × (1 − WER)). Not a pronunciation score. */
  score: number;
  wer: number;
  totalWords: number;
  correctCount: number;
  substitutionCount: number;
  deletionCount: number;
  insertionCount: number;
  normalizedText: string;
  wordResults: ShadowingWordResult[];
  errorSummary: ShadowingErrorSummary;
};

/** Safe for the browser before submit — never includes the transcript. */
export type PublicShadowingExercise = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  instructions: string | null;
  audioUrl: string;
  maxRecordSeconds: number;
};

export type ShadowingCatalogItem = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
};

export type ShadowingAttemptResult = ShadowingGrade & {
  attemptId: string;
  sttProvider: string;
  recognizedText: string;
  transcript: string;
  createdAt: string;
  /** Present while the recording is still retained. */
  recordingUrl: string | null;
  recordingExpiresAt: string | null;
};

export type ShadowingHistoryItem = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalWords: number;
  createdAt: string;
  hasRecording: boolean;
};

export type ShadowingAdminAttempt = ShadowingHistoryItem & {
  userId: string;
  userLabel: string;
  recognizedText: string;
  recordingUrl: string | null;
};
