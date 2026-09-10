import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export const LEARN_GUEST_COOKIE = "wewin_learn_guest";
const MAX_AGE_SEC = 60 * 60 * 24 * 365;

function isGuestKey(value: string) {
  return /^guest_[a-z0-9]+$/i.test(value);
}

/** Read-only owner key for RSC pages (does not set cookies). */
export async function getLearnOwnerKey(): Promise<string> {
  const user = await getSessionUser();
  if (user) return `user_${user.id}`;

  const jar = await cookies();
  const existing = jar.get(LEARN_GUEST_COOKIE)?.value;
  if (existing && isGuestKey(existing)) return existing;

  // No cookie yet — ephemeral; first API call will mint a guest id
  return "guest_pending";
}

/** Route handlers only: ensure a stable guest cookie when not logged in. */
export async function ensureLearnOwnerKey(): Promise<string> {
  const user = await getSessionUser();
  if (user) return `user_${user.id}`;

  const jar = await cookies();
  const existing = jar.get(LEARN_GUEST_COOKIE)?.value;
  if (existing && isGuestKey(existing)) return existing;

  const id = `guest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  jar.set(LEARN_GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return id;
}
