/**
 * Speaking AI score pipeline:
 * 1) Whisper-1 → transcript
 * 2) gpt-audio-1.5 → criterion draft when audio API accepts the clip; else text fallback
 * 3) gpt-4o-mini → final aggregate
 *
 * Official examiner prompts will replace stubs later.
 */

import { getOpenAiClient } from "@/lib/ai/client";
import {
  audioScoreModel,
  finalScoreModel,
  whisperModel,
} from "@/lib/ai/config";
import {
  SPEAKING_EXAMINER_SYSTEM,
} from "@/lib/ai/prompts";
import { aggregateFinalBand } from "@/lib/ai/score-writing";
import { transcribeAudio } from "@/lib/ai/transcribe";
import type { AiTaskScore, StoredAiScore } from "@/lib/ai/types";

export type SpeakingClipInput = {
  number: number;
  label?: string;
  prompt: string;
  partKind?: number;
  buffer: Buffer;
  filename: string;
  mimeType?: string;
};

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1]!.trim() : trimmed;
  try {
    const v = JSON.parse(body) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

function criteriaFromParsed(parsed: Record<string, unknown>) {
  return [
    {
      name: "Fluency & coherence",
      band: numOrNull(parsed.fluency),
      comment: "",
    },
    {
      name: "Lexical resource",
      band: numOrNull(parsed.lexical),
      comment: "",
    },
    {
      name: "Grammatical range & accuracy",
      band: numOrNull(parsed.grammar),
      comment: "",
    },
    {
      name: "Pronunciation",
      band: numOrNull(parsed.pronunciation),
      comment: "",
    },
  ];
}

function speakingUserPayload(input: {
  prompt: string;
  transcript: string;
  partKind?: number;
  label?: string;
}) {
  return JSON.stringify({
    partKind: input.partKind ?? null,
    label: input.label ?? null,
    prompt: input.prompt.slice(0, 3000),
    transcript: input.transcript.slice(0, 6000),
  });
}

async function scoreSpeakingFromTranscriptOnly(
  prompt: string,
  transcript: string,
  meta?: { partKind?: number; label?: string },
): Promise<{
  criteria: AiTaskScore["criteria"];
  band: number | null;
  feedback: string;
}> {
  const client = getOpenAiClient();
  const model = finalScoreModel();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${SPEAKING_EXAMINER_SYSTEM}\n\nLƯU Ý: Không có audio — pronunciation chỉ ước lượng thận trọng.`,
      },
      {
        role: "user",
        content: speakingUserPayload({
          prompt,
          transcript,
          partKind: meta?.partKind,
          label: meta?.label,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonObject(raw) ?? {};
  return {
    criteria: criteriaFromParsed(parsed),
    band: numOrNull(parsed.band),
    feedback: "",
  };
}

/**
 * Prefer gpt-audio-1.5 with base64 audio; fall back to transcript-only scoring.
 */
async function scoreSpeakingClip(input: {
  prompt: string;
  transcript: string;
  buffer: Buffer;
  mimeType?: string;
  partKind?: number;
  label?: string;
}): Promise<{
  criteria: AiTaskScore["criteria"];
  band: number | null;
  feedback: string;
  usedAudioModel: boolean;
}> {
  const client = getOpenAiClient();
  const model = audioScoreModel();
  const b64 = input.buffer.toString("base64");

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (client.chat.completions.create as any)({
      model,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: SPEAKING_EXAMINER_SYSTEM,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: speakingUserPayload(input),
            },
            {
              type: "input_audio",
              input_audio: {
                data: b64,
                format: "wav",
              },
            },
          ],
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;
    const raw =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map((c: { text?: string }) => c?.text ?? "")
              .join("")
          : "{}";
    const parsed = parseJsonObject(raw) ?? {};
    if (numOrNull(parsed.band) == null && numOrNull(parsed.fluency) == null) {
      throw new Error("empty audio model response");
    }
    return {
      criteria: criteriaFromParsed(parsed),
      band: numOrNull(parsed.band),
      feedback: "",
      usedAudioModel: true,
    };
  } catch {
    const fallback = await scoreSpeakingFromTranscriptOnly(
      input.prompt,
      input.transcript,
      { partKind: input.partKind, label: input.label },
    );
    return { ...fallback, usedAudioModel: false };
  }
}

export async function scoreSpeakingClips(
  clips: SpeakingClipInput[],
): Promise<Omit<StoredAiScore, "status" | "updatedAt" | "quotaConsumed">> {
  const scoredTasks: AiTaskScore[] = [];
  let usedAudio = false;

  for (const clip of clips) {
    if (!clip.buffer.length) {
      scoredTasks.push({
        number: clip.number,
        label: clip.label,
        transcript: null,
        criteria: [],
        band: null,
        feedback: "",
      });
      continue;
    }

    let transcript = "";
    try {
      transcript = await transcribeAudio({
        buffer: clip.buffer,
        filename: clip.filename,
        mimeType: clip.mimeType,
      });
    } catch {
      scoredTasks.push({
        number: clip.number,
        label: clip.label,
        transcript: null,
        criteria: [],
        band: null,
        feedback: "",
      });
      continue;
    }

    const scored = await scoreSpeakingClip({
      prompt: clip.prompt,
      transcript,
      buffer: clip.buffer,
      mimeType: clip.mimeType,
      partKind: clip.partKind,
      label: clip.label,
    });
    if (scored.usedAudioModel) usedAudio = true;

    scoredTasks.push({
      number: clip.number,
      label: clip.label,
      // Keep transcript off student-facing payload
      transcript: null,
      criteria: scored.criteria,
      band: scored.band,
      feedback: "",
    });
  }

  const overall = await aggregateFinalBand({
    skill: "SPEAKING",
    tasks: scoredTasks,
  });

  return {
    skill: "SPEAKING",
    overallBand: overall.band,
    summary: null,
    tasks: scoredTasks,
    models: {
      whisper: whisperModel(),
      audio: usedAudio ? audioScoreModel() : undefined,
      final: finalScoreModel(),
    },
    error: null,
    scoredAt: new Date().toISOString(),
  };
}
