import OpenAI from "openai";
import { openaiApiKey } from "@/lib/ai/config";

let cached: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  const key = openaiApiKey();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!cached) {
    cached = new OpenAI({ apiKey: key });
  }
  return cached;
}
