import type { HubBranch } from "@/lib/hub/placement-attempts-types";

export function scorePercent(
  correct: number | null,
  total: number | null,
): number | null {
  if (correct == null || total == null || total <= 0) return null;
  return Math.round((correct / total) * 100);
}

export function resolveHubBranch(): HubBranch {
  const raw = process.env.WEWIN_SITE_BRANCH?.trim().toUpperCase();
  return raw === "XVNT" ? "XVNT" : "NTL";
}

export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "https://ielts.wewin.edu.vn";
}

export function normalizeHubQuery(q: string | undefined): string {
  return (q ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d");
}

export function scoreFromPayload(
  payload: unknown,
  scoreRaw: number | null,
): {
  correct: number | null;
  total: number | null;
} {
  if (payload && typeof payload === "object") {
    const score = (payload as { score?: { correct?: unknown; total?: unknown } })
      .score;
    const correct =
      typeof score?.correct === "number" && Number.isFinite(score.correct)
        ? score.correct
        : null;
    const total =
      typeof score?.total === "number" && Number.isFinite(score.total)
        ? score.total
        : null;
    if (correct != null || total != null) {
      return { correct, total };
    }
  }
  if (scoreRaw != null && Number.isFinite(scoreRaw)) {
    return { correct: scoreRaw, total: null };
  }
  return { correct: null, total: null };
}

export function externalIdFromAttemptId(id: string): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  return `PT-${tail || id.slice(0, 4).toUpperCase()}`;
}
