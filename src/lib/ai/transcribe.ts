import { toFile } from "openai";
import { getOpenAiClient } from "@/lib/ai/client";
import { whisperModel } from "@/lib/ai/config";

export async function transcribeAudio(input: {
  buffer: Buffer;
  filename: string;
  mimeType?: string;
}): Promise<string> {
  const client = getOpenAiClient();
  const file = await toFile(input.buffer, input.filename, {
    type: input.mimeType || "audio/webm",
  });

  const result = await client.audio.transcriptions.create({
    file,
    model: whisperModel(),
    response_format: "text",
  });

  if (typeof result === "string") return result.trim();
  if (result && typeof result === "object" && "text" in result) {
    return String((result as { text: string }).text ?? "").trim();
  }
  return String(result ?? "").trim();
}
