import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveZoomAccountById, ZoomAccountError } from "./accounts";
import { getZoomHostZak, ZoomApiError, zoomApiRequest } from "./host-auth";

/** A Zoom user inside one of the configured WEWIN Zoom accounts. */
export type ZoomHostUser = {
  id: string;
  email: string;
  name: string;
  licensed: boolean;
};

export type ZoomHostAccountOption = {
  id: string;
  name: string;
  /** null when Zoom refused the list (usually missing `user:read:list_users:admin`). */
  users: ZoomHostUser[] | null;
  takenUserIds: string[];
};

export type MyZoomHost = {
  zoomAccountId: string;
  zoomAccountName: string;
  zoomUserId: string;
  zoomUserEmail: string | null;
} | null;

const LIST_TTL_MS = 5 * 60_000;
const MAX_PAGES = 5;
const listCache = new Map<string, { users: ZoomHostUser[]; expiresAt: number }>();

type ZoomUsersPage = {
  users?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    type?: number;
  }[];
  next_page_token?: string;
};

async function listZoomUsers(zoomAccountId: string): Promise<ZoomHostUser[]> {
  const hit = listCache.get(zoomAccountId);
  if (hit && hit.expiresAt > Date.now()) return hit.users;

  const account = await resolveZoomAccountById(zoomAccountId);
  if (!account.oauth) throw new ZoomAccountError("ZOOM_ACCOUNT_REQUIRED", 409);
  const users: ZoomHostUser[] = [];
  let pageToken = "";
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = await zoomApiRequest<ZoomUsersPage>(account.oauth, "GET", "/users", {
      query: {
        status: "active",
        page_size: "300",
        ...(pageToken ? { next_page_token: pageToken } : {}),
      },
    });
    for (const user of body?.users ?? []) {
      const name =
        user.display_name?.trim() ||
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.email ||
        user.id;
      users.push({ id: user.id, email: user.email ?? "", name, licensed: (user.type ?? 1) >= 2 });
    }
    pageToken = body?.next_page_token ?? "";
    if (!pageToken) break;
  }
  users.sort((a, b) => a.name.localeCompare(b.name));
  listCache.set(zoomAccountId, { users, expiresAt: Date.now() + LIST_TTL_MS });
  return users;
}

/** Every configured Zoom account with its users, for the "my Zoom" picker. */
export async function listZoomHostOptions(viewerId: string): Promise<ZoomHostAccountOption[]> {
  const [accounts, links] = await Promise.all([
    prisma.zoomAccount.findMany({
      select: { id: true, name: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.user.findMany({
      where: { zoomAccountId: { not: null }, id: { not: viewerId } },
      select: { zoomAccountId: true, zoomUserId: true },
    }),
  ]);
  return Promise.all(
    accounts.map(async (account) => {
      let users: ZoomHostUser[] | null = null;
      try {
        users = await listZoomUsers(account.id);
      } catch (error) {
        if (!(error instanceof ZoomApiError)) throw error;
      }
      return {
        id: account.id,
        name: account.name,
        users,
        takenUserIds: links
          .filter((link) => link.zoomAccountId === account.id && link.zoomUserId)
          .map((link) => link.zoomUserId as string),
      };
    }),
  );
}

export async function getMyZoomHost(userId: string): Promise<MyZoomHost> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      zoomUserId: true,
      zoomUserEmail: true,
      zoomAccount: { select: { id: true, name: true } },
    },
  });
  if (!row?.zoomAccount || !row.zoomUserId) return null;
  return {
    zoomAccountId: row.zoomAccount.id,
    zoomAccountName: row.zoomAccount.name,
    zoomUserId: row.zoomUserId,
    zoomUserEmail: row.zoomUserEmail,
  };
}

const setSchema = z.object({
  zoomAccountId: z.string().trim().min(1).max(100),
  /** Zoom user id from the list, or an email typed by hand. */
  zoomUser: z.string().trim().min(1).max(200),
});

/**
 * Links a WEWIN staff member to a Zoom user. Proven by fetching that user's ZAK —
 * the same call the classroom makes when the teacher starts a class.
 */
export async function setMyZoomHost(userId: string, raw: unknown): Promise<MyZoomHost> {
  const parsed = setSchema.safeParse(raw);
  if (!parsed.success) throw new ZoomAccountError("INVALID_INPUT");
  const { zoomAccountId, zoomUser } = parsed.data;
  const account = await resolveZoomAccountById(zoomAccountId);
  if (!account.oauth) throw new ZoomAccountError("ZOOM_ACCOUNT_REQUIRED", 409);

  let users: ZoomHostUser[] | null = null;
  try {
    users = await listZoomUsers(zoomAccountId);
  } catch {
    users = null;
  }
  const needle = zoomUser.toLowerCase();
  const match = users?.find((u) => u.id === zoomUser || u.email.toLowerCase() === needle);
  if (users && !match) throw new ZoomAccountError("ZOOM_USER_NOT_FOUND", 404);
  const zoomUserId = match?.id ?? zoomUser;
  const zoomUserEmail = match?.email || (zoomUser.includes("@") ? zoomUser : null);

  const taken = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      zoomAccountId,
      OR: [
        { zoomUserId },
        ...(zoomUserEmail
          ? [{ zoomUserEmail: { equals: zoomUserEmail, mode: "insensitive" as const } }]
          : []),
      ],
    },
    select: { id: true },
  });
  if (taken) throw new ZoomAccountError("ZOOM_USER_TAKEN", 409);

  await getZoomHostZak(account.oauth, zoomUserId);

  await prisma.user.update({
    where: { id: userId },
    data: { zoomAccountId, zoomUserId, zoomUserEmail },
  });
  return getMyZoomHost(userId);
}

export async function clearMyZoomHost(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { zoomAccountId: null, zoomUserId: null, zoomUserEmail: null },
  });
}

/** Zoom account + user that should own meetings hosted by this WEWIN user. */
export async function zoomHostLinkFor(
  userId: string | null,
): Promise<{ zoomAccountId: string; zoomUserId: string } | null> {
  if (!userId) return null;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { zoomAccountId: true, zoomUserId: true },
  });
  return row?.zoomAccountId && row.zoomUserId
    ? { zoomAccountId: row.zoomAccountId, zoomUserId: row.zoomUserId }
    : null;
}
