import type { DictationErrorSummary, DictationWordResult } from "@/lib/dictation/types";
import type { CueTiming } from "@/lib/shadowing/cues";
import type { LineAnnotation } from "@/lib/shadowing/annotations";

export type ShadowingWordResult = DictationWordResult;
export type ShadowingErrorSummary = DictationErrorSummary;

/** Identifies which speech-to-text backend produced the recognized text. */
export type SttProviderId = "web-speech";

export const DEFAULT_MAX_RECORD_SECONDS = 30;
export const MIN_RECORD_SECONDS = 5;
export const MAX_RECORD_SECONDS = 300;

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

export type SentenceResult = {
  score: number;
  wer: number;
  totalWords: number;
  correctCount: number;
  substitutionCount: number;
  deletionCount: number;
  insertionCount: number;
  recognizedText: string;
  wordResults: ShadowingWordResult[];
  recordingUrl?: string;
};

/** Sent to the browser; the transcript is shown so learners can read along while shadowing. */
export type PublicShadowingExercise = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  instructions: string | null;
  audioUrl: string;
  /** Model video; when set it replaces the audio player and its sound track is `audioUrl`. */
  videoUrl: string | null;
  maxRecordSeconds: number;
  transcript: string;
  /** Aligned sentence timings matching `transcriptLines(transcript)`; null → estimated in the browser. */
  cues: CueTiming[] | null;
  /** Per-sentence IPA / translation aligned with `transcriptLines(transcript)`; null → none. */
  annotations: LineAnnotation[] | null;
};

export type ShadowingCatalogItem = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  hasVideo?: boolean;
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
