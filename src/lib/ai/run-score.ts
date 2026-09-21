/**
 * Orchestrates AI scoring for a finished Writing / Speaking attempt.
 * OpenAI is only called once per attempt, and only when invoked with a
 * valid one-time submit nonce (see /api/practice/[id]/ai-score).
 */

import { isAdmin } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth";
import { isOpenAiConfigured } from "@/lib/ai/config";
import {
  canUseAiScore,
  consumeAiQuota,
  getAiQuota,
} from "@/lib/ai/quota";
import { scoreSpeakingClips, type SpeakingClipInput } from "@/lib/ai/score-speaking";
import { scoreWritingTasks, type WritingTaskInput } from "@/lib/ai/score-writing";
import type { AiScoreSkill, StoredAiScore } from "@/lib/ai/types";
import type { StoredAttempt } from "@/lib/store/test-store";
import { saveAttempt } from "@/lib/store/test-store";

function nowIso() {
  return new Date().toISOString();
}

function baseScore(
  skill: AiScoreSkill,
  status: StoredAiScore["status"],
  extra?: Partial<StoredAiScore>,
): StoredAiScore {
  return {
    skill,
    status,
    overallBand: null,
    summary: null,
    tasks: [],
    error: null,
    scoredAt: null,
    updatedAt: nowIso(),
    ...extra,
  };
}

/** Any prior AI outcome — never call OpenAI again for this attempt. */
function alreadyResolved(ai: StoredAiScore | undefined): ai is StoredAiScore {
  if (!ai) return false;
  return (
    ai.status === "ready" ||
    ai.status === "failed" ||
    ai.status === "scoring" ||
    ai.status === "skipped_quota" ||
    ai.status === "skipped_guest" ||
    ai.status === "skipped_config" ||
    ai.status === "skipped_no_audio" ||
    ai.status === "skipped_not_submit"
  );
}

export async function runAiScoreForAttempt(input: {
  attempt: StoredAttempt;
  skill: AiScoreSkill;
  user: SessionUser | null;
  writingTasks?: WritingTaskInput[];
  speakingClips?: SpeakingClipInput[];
}): Promise<{ attempt: StoredAttempt; aiScore: StoredAiScore }> {
  const { attempt, skill, user } = input;

  if (alreadyResolved(attempt.aiScore)) {
    return { attempt, aiScore: attempt.aiScore };
  }

  if (!isOpenAiConfigured()) {
    const aiScore = baseScore(skill, "skipped_config", {
      error: "OpenAI is not configured",
    });
    attempt.aiScore = aiScore;
    attempt.aiScoreNonce = null;
    await saveAttempt(attempt);
    return { attempt, aiScore };
  }

  if (!user) {
    const aiScore = baseScore(skill, "skipped_guest", {
      error: "Login required for AI scoring",
    });
    attempt.aiScore = aiScore;
    attempt.aiScoreNonce = null;
    await saveAttempt(attempt);
    return { attempt, aiScore };
  }

  const quota = await getAiQuota(user.id);
  const gate = canUseAiScore(user, quota, skill);
  if (!gate.ok) {
    const aiScore = baseScore(
      skill,
      gate.reason === "guest" ? "skipped_guest" : "skipped_quota",
      {
        error:
          gate.reason === "quota"
            ? "Daily AI scoring limit reached (1 Speaking + 1 Writing per day)"
            : "Login required for AI scoring",
      },
    );
    attempt.aiScore = aiScore;
    attempt.aiScoreNonce = null;
    await saveAttempt(attempt);
    return { attempt, aiScore };
  }

  if (skill === "SPEAKING" && (input.speakingClips?.length ?? 0) === 0) {
    const aiScore = baseScore(skill, "skipped_no_audio", {
      error: "No audio uploaded at submit",
    });
    attempt.aiScore = aiScore;
    attempt.aiScoreNonce = null;
    await saveAttempt(attempt);
    return { attempt, aiScore };
  }

  const unlimited = isAdmin(user);

  // Lock before OpenAI so concurrent POSTs cannot double-bill
  attempt.aiScore = baseScore(skill, "scoring", { quotaConsumed: false });
  attempt.aiScoreNonce = null;
  await saveAttempt(attempt);

  try {
    const result =
      skill === "WRITING"
        ? await scoreWritingTasks(input.writingTasks ?? [])
        : await scoreSpeakingClips(input.speakingClips ?? []);

    const { consumed } = await consumeAiQuota(user.id, skill, { unlimited });

    const aiScore: StoredAiScore = {
      ...result,
      status: "ready",
      quotaConsumed: consumed,
      updatedAt: nowIso(),
    };
    attempt.aiScore = aiScore;
    await saveAttempt(attempt);
    return { attempt, aiScore };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const aiScore = baseScore(skill, "failed", {
      error: message,
      quotaConsumed: false,
    });
    attempt.aiScore = aiScore;
    await saveAttempt(attempt);
    return { attempt, aiScore };
  }
}
