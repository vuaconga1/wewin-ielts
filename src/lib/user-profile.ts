/**
 * Resolve persisted profile fields (avatar + display name) for a session user.
 */

import { cache } from "react";
import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { findLocalUserById } from "@/lib/store/user-store";

const PROFILE_TTL_MS = 60_000;

export type UserDisplayProfile = {
  avatarUrl: string | null;
  fullName: string | null;
};

type ProfileCacheEntry = { profile: UserDisplayProfile; expiresAt: number };

/** Warm-instance cache so soft navs do not re-hit Prisma for the same profile. */
const profileByUserId = new Map<string, ProfileCacheEntry>();

function readProfileCache(userId: string): UserDisplayProfile | undefined {
  const hit = profileByUserId.get(userId);
  if (!hit) return undefined;
  if (Date.now() >= hit.expiresAt) {
    profileByUserId.delete(userId);
    return undefined;
  }
  return hit.profile;
}

function writeProfileCache(userId: string, profile: UserDisplayProfile) {
  profileByUserId.set(userId, {
    profile,
    expiresAt: Date.now() + PROFILE_TTL_MS,
  });
}

export function invalidateAvatarCache(userId: string) {
  profileByUserId.delete(userId);
}

async function loadUserDisplayProfile(
  userId: string,
): Promise<UserDisplayProfile> {
  const cached = readProfileCache(userId);
  if (cached) return cached;

  if (await canUsePrisma()) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true, fullName: true },
      });
      if (user) {
        const profile = {
          avatarUrl: user.avatarUrl ?? null,
          fullName: user.fullName ?? null,
        };
        writeProfileCache(userId, profile);
        return profile;
      }
    } catch {
      /* fall through */
    }
  }

  const local = await findLocalUserById(userId);
  const profile = {
    avatarUrl: local?.avatarUrl ?? null,
    fullName: local?.fullName ?? null,
  };
  writeProfileCache(userId, profile);
  return profile;
}

/** React.cache: one Prisma lookup per userId per request. */
export const getUserDisplayProfile = cache(loadUserDisplayProfile);

export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const profile = await getUserDisplayProfile(userId);
  return profile.avatarUrl;
}

export async function setUserAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<boolean> {
  let saved = false;
  let fullName: string | null = null;

  if (await canUsePrisma()) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { fullName: true },
      });
      fullName = updated.fullName ?? null;
      saved = true;
    } catch {
      /* fall through to local */
    }
  }

  const { updateLocalUserAvatar, findLocalUserById } = await import(
    "@/lib/store/user-store"
  );
  const local = await findLocalUserById(userId);
  if (local) {
    await updateLocalUserAvatar(userId, avatarUrl);
    fullName = local.fullName ?? fullName;
    saved = true;
  }

  if (saved) {
    writeProfileCache(userId, { avatarUrl, fullName });
  }

  return saved;
}
