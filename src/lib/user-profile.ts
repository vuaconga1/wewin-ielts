/**
 * Resolve persisted profile fields (avatar) for a session user.
 */

import { cache } from "react";
import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { findLocalUserById } from "@/lib/store/user-store";

const AVATAR_TTL_MS = 60_000;

type AvatarCacheEntry = { url: string | null; expiresAt: number };

/** Warm-instance cache so soft navs do not re-hit Prisma for the same avatar. */
const avatarByUserId = new Map<string, AvatarCacheEntry>();

function readAvatarCache(userId: string): string | null | undefined {
  const hit = avatarByUserId.get(userId);
  if (!hit) return undefined;
  if (Date.now() >= hit.expiresAt) {
    avatarByUserId.delete(userId);
    return undefined;
  }
  return hit.url;
}

function writeAvatarCache(userId: string, url: string | null) {
  avatarByUserId.set(userId, {
    url,
    expiresAt: Date.now() + AVATAR_TTL_MS,
  });
}

export function invalidateAvatarCache(userId: string) {
  avatarByUserId.delete(userId);
}

async function loadUserAvatarUrl(userId: string): Promise<string | null> {
  const cached = readAvatarCache(userId);
  if (cached !== undefined) return cached;

  if (await canUsePrisma()) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });
      if (user) {
        const url = user.avatarUrl ?? null;
        writeAvatarCache(userId, url);
        return url;
      }
    } catch {
      /* fall through */
    }
  }

  const local = await findLocalUserById(userId);
  const url = local?.avatarUrl ?? null;
  writeAvatarCache(userId, url);
  return url;
}

/** React.cache: one Prisma lookup per userId per request. */
export const getUserAvatarUrl = cache(loadUserAvatarUrl);

export async function setUserAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<boolean> {
  let saved = false;

  if (await canUsePrisma()) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });
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
    saved = true;
  }

  if (saved) {
    writeAvatarCache(userId, avatarUrl);
  }

  return saved;
}
