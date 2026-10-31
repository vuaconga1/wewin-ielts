/**
 * Combine many practice attempts on one test (often one part per attempt)
 * into a single "final result" for staff views.
 */

import { estimateBand } from "@/lib/scoring";

export type CombinableAttempt = {
  id: string;
  status: "FINISHED" | "UNFINISHED";
  startedAt: string;
  finishedAt: string | null;
  /** Parts / passages in this attempt; empty = whole test. */
  sectionOrders: number[];
  /** Redo-wrong-answers attempt (subset of questions) — not a real part score. */
  partial: boolean;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  scoreBand: number | null;
};

export type CombinedTestResult = {
  totalAttempts: number;
  finishedAttempts: number;
  /** Sum of the latest submission per part (Listening / Reading). */
  correct: number | null;
  total: number | null;
  percent: number | null;
  /** AI band (Writing / Speaking) or estimated band once every part is covered. */
  band: number | null;
  sectionsCovered: number[];
  sectionCount: number;
  complete: boolean;
  /** Attempts whose scores make up the final result. */
  usedAttemptIds: string[];
  totalDurationSeconds: number;
  firstStartedAt: string;
  lastActivityAt: string;
  latestAttemptId: string;
  latestStatus: "FINISHED" | "UNFINISHED";
};

/** Part orders → 1-based numbers learners see (catalog orders may start at 0). */
export function partNumbers(orders: number[], testSectionOrders: number[]): number[] {
  const all = [...new Set(testSectionOrders)].sort((a, b) => a - b);
  const zeroBased = all.length ? all[0] === 0 : orders.includes(0);
  return [...orders]
    .sort((a, b) => a - b)
    .map((o) => {
      const idx = all.indexOf(o);
      return idx >= 0 ? idx + 1 : zeroBased ? o + 1 : o;
    });
}

export function attemptDurationSeconds(
  startedAt: string,
  finishedAt: string | null,
): number | null {
  if (!finishedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

function newestFirst(a: CombinableAttempt, b: CombinableAttempt) {
  const at = a.finishedAt ?? a.startedAt;
  const bt = b.finishedAt ?? b.startedAt;
  return at < bt ? 1 : at > bt ? -1 : 0;
}

/**
 * Non-overlapping attempts covering the most parts; ties go to the newest
 * submissions. `attempts` must be newest-first.
 */
function pickBestCoverage(
  attempts: CombinableAttempt[],
  allSections: number[],
): CombinableAttempt[] {
  if (!allSections.length) {
    const whole = attempts.find((a) => !a.sectionOrders.length);
    return whole ? [whole] : attempts.slice(0, 1);
  }
  const bit = new Map<number, number>();
  for (const o of allSections) bit.set(o, bit.size);
  for (const a of attempts) {
    for (const o of a.sectionOrders) if (!bit.has(o)) bit.set(o, bit.size);
  }
  if (bit.size > 20) return attempts.slice(0, 1);

  const maskOf = (a: CombinableAttempt) => {
    const orders = a.sectionOrders.length ? a.sectionOrders : allSections;
    return orders.reduce((m, o) => m | (1 << bit.get(o)!), 0);
  };
  const popcount = (m: number) => {
    let n = 0;
    for (; m; m &= m - 1) n++;
    return n;
  };

  // best[mask] = attempt indexes (newest-first order) — lexicographically
  // smallest index list wins, i.e. the most recent submissions.
  const best = new Map<number, number[]>([[0, []]]);
  const better = (a: number[], b: number[]) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) return a[i]! < b[i]!;
    }
    return a.length < b.length;
  };
  attempts.slice(0, 40).forEach((a, idx) => {
    const m = maskOf(a);
    if (!m) return;
    for (const [state, picks] of [...best]) {
      if (state & m) continue;
      const next = state | m;
      const cand = [...picks, idx];
      const cur = best.get(next);
      if (!cur || better(cand, cur)) best.set(next, cand);
    }
  });

  let winner: number[] = [];
  let winnerCover = 0;
  for (const [state, picks] of best) {
    const cover = popcount(state);
    if (cover > winnerCover || (cover === winnerCover && better(picks, winner))) {
      winner = picks;
      winnerCover = cover;
    }
  }
  return winner.map((i) => attempts[i]!);
}

/**
 * @param testSectionOrders all part orders of the test (from the catalog);
 *   empty when unknown.
 */
export function combineTestAttempts(
  attempts: CombinableAttempt[],
  skill: string | null,
  testSectionOrders: number[],
): CombinedTestResult | null {
  if (!attempts.length) return null;
  const sorted = [...attempts].sort(newestFirst);
  const finished = sorted.filter((a) => a.status === "FINISHED");
  const allSections = [...new Set(testSectionOrders)].sort((a, b) => a - b);

  let correct: number | null = null;
  let total: number | null = null;
  let band: number | null = null;
  const covered = new Set<number>();
  const used: string[] = [];

  if (skill === "WRITING" || skill === "SPEAKING") {
    const scored = finished.find((a) => a.scoreBand != null);
    if (scored) {
      band = scored.scoreBand;
      used.push(scored.id);
      const orders = scored.sectionOrders.length
        ? scored.sectionOrders
        : allSections;
      for (const o of orders) covered.add(o);
    }
  } else {
    const scored = finished.filter(
      (a) => !a.partial && a.scoreCorrect != null && a.scoreTotal != null,
    );
    const picked = pickBestCoverage(scored, allSections);
    for (const a of picked) {
      const orders = a.sectionOrders.length ? a.sectionOrders : allSections;
      for (const o of orders) covered.add(o);
      correct = (correct ?? 0) + a.scoreCorrect!;
      total = (total ?? 0) + a.scoreTotal!;
      used.push(a.id);
    }
    const coversAll = allSections.length
      ? allSections.every((o) => covered.has(o))
      : picked.length > 0;
    if (coversAll && correct != null && total) {
      band = estimateBand(correct, total);
    }
  }

  const sectionsCovered = [...covered].sort((a, b) => a - b);
  const complete =
    allSections.length > 0
      ? allSections.every((o) => covered.has(o))
      : used.length > 0;

  let totalDurationSeconds = 0;
  for (const a of finished) {
    totalDurationSeconds += attemptDurationSeconds(a.startedAt, a.finishedAt) ?? 0;
  }

  const firstStartedAt = sorted.reduce(
    (min, a) => (a.startedAt < min ? a.startedAt : min),
    sorted[0]!.startedAt,
  );
  const latest = sorted[0]!;

  return {
    totalAttempts: attempts.length,
    finishedAttempts: finished.length,
    correct,
    total,
    percent:
      correct != null && total ? Math.round((correct / total) * 100) : null,
    band,
    sectionsCovered,
    sectionCount: allSections.length,
    complete,
    usedAttemptIds: used,
    totalDurationSeconds,
    firstStartedAt,
    lastActivityAt: latest.finishedAt ?? latest.startedAt,
    latestAttemptId: latest.id,
    latestStatus: latest.status,
  };
}
