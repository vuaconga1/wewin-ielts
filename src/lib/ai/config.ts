/**
 * OpenAI model / key config for Speaking & Writing AI scoring.
 * Keys must live in gitignored .env — never hardcode secrets.
 */

export function openaiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function whisperModel(): string {
  return process.env.OPENAI_WHISPER_MODEL?.trim() || "whisper-1";
}

export function audioScoreModel(): string {
  return process.env.OPENAI_AUDIO_MODEL?.trim() || "gpt-audio-1.5";
}

export function finalScoreModel(): string {
  return process.env.OPENAI_SCORE_MODEL?.trim() || "gpt-4o-mini";
}

export function isOpenAiConfigured(): boolean {
  return openaiApiKey() != null;
}
