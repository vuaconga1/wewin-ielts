/**
 * Resolve persisted profile fields (avatar) for a session user.
 */

import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { findLocalUserById } from "@/lib/store/user-store";

export async function getUserAvatarUrl(
  userId: string,
): Promise<string | null> {
  if (await canUsePrisma()) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });
      if (user?.avatarUrl) return user.avatarUrl;
    } catch {
      /* fall through */
    }
  }

  const local = await findLocalUserById(userId);
  return local?.avatarUrl ?? null;
}

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

  return saved;
}
