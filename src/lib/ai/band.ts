/**
 * IELTS band arithmetic: bands are whole or half numbers only.
 * Fraction < .25 rounds down, .25–<.75 becomes .5, ≥ .75 rounds up.
 */

import type { AiTaskScore } from "@/lib/ai/types";

export function roundIeltsBand(n: number): number {
  const clamped = Math.min(9, Math.max(0, n));
  const whole = Math.floor(clamped + 1e-9);
  const frac = clamped - whole;
  if (frac < 0.25 - 1e-9) return whole;
  if (frac < 0.75 - 1e-9) return whole + 0.5;
  return whole + 1;
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** The model's task band rounded to a valid band; the mean of its criteria when the model gave none. */
export function taskBand(task: Pick<AiTaskScore, "band" | "criteria">): number | null {
  const scored = task.criteria
    .map((c) => c.band)
    .filter((b): b is number => typeof b === "number" && Number.isFinite(b));
  const raw = task.band != null && Number.isFinite(task.band) ? task.band : mean(scored);
  return raw == null ? null : roundIeltsBand(raw);
}

/**
 * Writing: Task 2 counts double (Task 1 = 1/3, Task 2 = 2/3).
 * Speaking: average of the scored answers.
 */
export function overallBand(
  skill: "WRITING" | "SPEAKING",
  tasks: Pick<AiTaskScore, "band" | "label" | "number">[],
): number | null {
  const scored = tasks.filter(
    (t): t is typeof t & { band: number } => typeof t.band === "number" && Number.isFinite(t.band),
  );
  if (!scored.length) return null;
  if (skill === "SPEAKING") return roundIeltsBand(mean(scored.map((t) => t.band))!);

  const weight = (t: (typeof scored)[number], index: number) => {
    if (/task\s*2/i.test(t.label ?? "")) return 2;
    if (/task\s*1/i.test(t.label ?? "")) return 1;
    return scored.length === 2 && index === 1 ? 2 : 1;
  };
  const weights = scored.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  const sum = scored.reduce((acc, t, i) => acc + t.band * weights[i]!, 0);
  return roundIeltsBand(sum / total);
}
