/**
 * Writing AI score — WEWIN IELTS examiner prompts + Academic weighting.
 * Student-facing result: scores only (no feedback text).
 */

import { getOpenAiClient } from "@/lib/ai/client";
import { finalScoreModel } from "@/lib/ai/config";
import {
  WRITING_AGGREGATE_SYSTEM,
  WRITING_EXAMINER_SYSTEM,
} from "@/lib/ai/prompts";
import type { AiTaskScore, StoredAiScore } from "@/lib/ai/types";

export type WritingTaskInput = {
  number: number;
  label?: string;
  prompt: string;
  essay: string;
  minWords?: number;
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

function detectTaskType(task: WritingTaskInput): "task1" | "task2" {
  const blob = `${task.label ?? ""} ${task.prompt}`.toLowerCase();
  if (/task\s*2|essay|discuss|agree|opinion|to what extent/.test(blob)) {
    return "task2";
  }
  if (/task\s*1|chart|graph|map|process|table|diagram/.test(blob)) {
    return "task1";
  }
  if (task.minWords != null && task.minWords >= 200) return "task2";
  if (task.minWords != null && task.minWords <= 170) return "task1";
  return task.number <= 1 ? "task1" : "task2";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function scoreWritingTasks(
  tasks: WritingTaskInput[],
): Promise<Omit<StoredAiScore, "status" | "updatedAt" | "quotaConsumed">> {
  const client = getOpenAiClient();
  const model = finalScoreModel();
  const scoredTasks: AiTaskScore[] = [];

  for (const task of tasks) {
    const essay = task.essay.trim();
    const taskType = detectTaskType(task);
    if (!essay) {
      scoredTasks.push({
        number: task.number,
        label: task.label ?? (taskType === "task1" ? "Task 1" : "Task 2"),
        criteria: [
          { name: "Task achievement / response", band: 0, comment: "" },
          { name: "Coherence & cohesion", band: 0, comment: "" },
          { name: "Lexical resource", band: 0, comment: "" },
          { name: "Grammatical range & accuracy", band: 0, comment: "" },
        ],
        band: 0,
        feedback: "",
      });
      continue;
    }

    const minWords = task.minWords ?? (taskType === "task1" ? 150 : 250);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: WRITING_EXAMINER_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            taskType,
            taskNumber: task.number,
            label: task.label ?? null,
            minWords,
            observedWordCount: wordCount(essay),
            prompt: task.prompt.slice(0, 4000),
            essay: essay.slice(0, 8000),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseJsonObject(raw) ?? {};
    const ta = numOrNull(parsed.taOrTr) ?? numOrNull(parsed.taskAchievement);
    const criteria = [
      {
        name: taskType === "task1" ? "Task achievement" : "Task response",
        band: ta,
        comment: "",
      },
      {
        name: "Coherence & cohesion",
        band: numOrNull(parsed.cc) ?? numOrNull(parsed.coherence),
        comment: "",
      },
      {
        name: "Lexical resource",
        band: numOrNull(parsed.lr) ?? numOrNull(parsed.lexical),
        comment: "",
      },
      {
        name: "Grammatical range & accuracy",
        band: numOrNull(parsed.gra) ?? numOrNull(parsed.grammar),
        comment: "",
      },
    ];

    scoredTasks.push({
      number: task.number,
      label: task.label ?? (taskType === "task1" ? "Task 1" : "Task 2"),
      criteria,
      band: numOrNull(parsed.band),
      feedback: "",
    });
  }

  const overall = await aggregateFinalBand({
    skill: "WRITING",
    tasks: scoredTasks,
  });

  return {
    skill: "WRITING",
    overallBand: overall.band,
    summary: null,
    tasks: scoredTasks,
    models: { final: model },
    error: null,
    scoredAt: new Date().toISOString(),
  };
}

export async function aggregateFinalBand(input: {
  skill: "WRITING" | "SPEAKING";
  tasks: AiTaskScore[];
}): Promise<{ band: number | null; summary: string | null }> {
  const client = getOpenAiClient();
  const model = finalScoreModel();
  const system =
    input.skill === "WRITING"
      ? WRITING_AGGREGATE_SYSTEM
      : (await import("@/lib/ai/prompts")).SPEAKING_AGGREGATE_SYSTEM;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          skill: input.skill,
          tasks: input.tasks.map((t) => ({
            number: t.number,
            label: t.label,
            band: t.band,
            criteria: t.criteria.map((c) => ({
              name: c.name,
              band: c.band,
            })),
          })),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonObject(raw) ?? {};
  return {
    band: numOrNull(parsed.band),
    summary: null,
  };
}
