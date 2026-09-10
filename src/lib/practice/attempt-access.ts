/**
 * Ownership checks for practice attempts.
 * Attempts bound to a userId are only readable/writable by that user (or ADMIN).
 * Guest attempts (userId null) remain accessible by attempt id.
 */

import type { StoredAttempt } from "@/lib/store/test-store";

type SessionLike = {
  id: string;
  role: "ADMIN" | "STUDENT";
} | null;

export function canAccessAttempt(
  attempt: Pick<StoredAttempt, "userId">,
  user: SessionLike,
): boolean {
  if (!attempt.userId) return true;
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.id === attempt.userId;
}

/** Attach session user to a guest attempt when first saved/submitted. */
export function claimAttemptIfGuest(
  attempt: StoredAttempt,
  user: SessionLike,
): void {
  if (user && !attempt.userId) {
    attempt.userId = user.id;
  }
}
