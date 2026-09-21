export type AiScoreSkill = "SPEAKING" | "WRITING";

export type AiCriterionScore = {
  name: string;
  band: number | null;
  comment: string;
};

export type AiTaskScore = {
  /** Question / task number within the attempt */
  number: number;
  label?: string;
  transcript?: string | null;
  criteria: AiCriterionScore[];
  band: number | null;
  feedback: string;
};

export type AiScoreStatus =
  | "pending"
  | "scoring"
  | "ready"
  | "failed"
  | "skipped_quota"
  | "skipped_guest"
  | "skipped_config"
  | "skipped_no_audio"
  | "skipped_not_submit";

export type StoredAiScore = {
  skill: AiScoreSkill;
  status: AiScoreStatus;
  /** Overall band 0–9 (0.5 steps) when ready */
  overallBand: number | null;
  summary: string | null;
  tasks: AiTaskScore[];
  models?: {
    whisper?: string;
    audio?: string;
    final?: string;
  };
  error?: string | null;
  quotaConsumed?: boolean;
  scoredAt?: string | null;
  updatedAt: string;
};

export type AiQuotaDay = {
  date: string; // YYYY-MM-DD (UTC+7 calendar day for VN)
  speaking: boolean;
  writing: boolean;
};
