import "server-only";
import { z } from "zod";
import {
  decryptClassroomSecret,
  encryptClassroomSecret,
} from "@/lib/classroom/secret";
import { prisma } from "@/lib/prisma";
import {
  envZoomOAuthCredentials,
  forgetZoomAccessToken,
  getZoomHostZak,
  ZoomApiError,
  type ZoomOAuthCredentials,
} from "./host-auth";
import {
  envMeetingSdkCredentials,
  type MeetingSdkCredentials,
} from "./sdk-signature";

export class ZoomAccountError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}

export type ZoomAccountPublic = {
  id: string;
  name: string;
  accountId: string;
  clientId: string;
  sdkKey: string;
  hostUserId: string;
  isDefault: boolean;
  lastVerifiedAt: string | null;
  classroomCount: number;
  sessionCount: number;
};

export type ResolvedZoomAccount = {
  id: string | null;
  hostUserId: string;
  oauth: ZoomOAuthCredentials | null;
  sdk: MeetingSdkCredentials | null;
};

const text = (max: number) => z.string().trim().min(1).max(max);

const createSchema = z.object({
  name: text(100),
  accountId: text(200),
  clientId: text(200),
  clientSecret: text(500),
  sdkKey: text(200),
  sdkSecret: text(500),
  hostUserId: z.string().trim().max(200).optional(),
  isDefault: z.boolean().optional(),
});

const updateSchema = z.object({
  name: text(100).optional(),
  accountId: text(200).optional(),
  clientId: text(200).optional(),
  clientSecret: z.string().trim().max(500).optional(),
  sdkKey: text(200).optional(),
  sdkSecret: z.string().trim().max(500).optional(),
  hostUserId: z.string().trim().max(200).optional(),
  isDefault: z.boolean().optional(),
});

const publicSelect = {
  id: true,
  name: true,
  accountId: true,
  clientId: true,
  sdkKey: true,
  hostUserId: true,
  isDefault: true,
  lastVerifiedAt: true,
  _count: { select: { classrooms: true, liveSessions: true } },
} as const;

type PublicRow = {
  id: string;
  name: string;
  accountId: string;
  clientId: string;
  sdkKey: string;
  hostUserId: string;
  isDefault: boolean;
  lastVerifiedAt: Date | null;
  _count: { classrooms: number; liveSessions: number };
};

function toPublic(row: PublicRow): ZoomAccountPublic {
  return {
    id: row.id,
    name: row.name,
    accountId: row.accountId,
    clientId: row.clientId,
    sdkKey: row.sdkKey,
    hostUserId: row.hostUserId,
    isDefault: row.isDefault,
    lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
    classroomCount: row._count.classrooms,
    sessionCount: row._count.liveSessions,
  };
}

export async function listZoomAccounts(): Promise<ZoomAccountPublic[]> {
  const rows = await prisma.zoomAccount.findMany({
    select: publicSelect,
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toPublic);
}

/** Id + name only, for pickers on class/session forms. */
export async function listZoomAccountOptions() {
  return prisma.zoomAccount.findMany({
    select: { id: true, name: true, isDefault: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function createZoomAccount(raw: unknown): Promise<ZoomAccountPublic> {
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) throw new ZoomAccountError("INVALID_INPUT");
  const input = parsed.data;
  const existingCount = await prisma.zoomAccount.count();
  const isDefault = input.isDefault || existingCount === 0;
  const row = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.zoomAccount.updateMany({ data: { isDefault: false } });
    }
    return tx.zoomAccount.create({
      data: {
        name: input.name,
        accountId: input.accountId,
        clientId: input.clientId,
        clientSecretCiphertext: encryptClassroomSecret(input.clientSecret),
        sdkKey: input.sdkKey,
        sdkSecretCiphertext: encryptClassroomSecret(input.sdkSecret),
        hostUserId: input.hostUserId || "me",
        isDefault,
      },
      select: publicSelect,
    });
  });
  return toPublic(row);
}

export async function updateZoomAccount(
  id: string,
  raw: unknown,
): Promise<ZoomAccountPublic> {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) throw new ZoomAccountError("INVALID_INPUT");
  const input = parsed.data;
  const existing = await prisma.zoomAccount.findUnique({
    where: { id },
    select: { accountId: true, clientId: true },
  });
  if (!existing) throw new ZoomAccountError("NOT_FOUND", 404);
  const credentialsChanged = Boolean(
    input.accountId || input.clientId || input.clientSecret,
  );
  const row = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.zoomAccount.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.zoomAccount.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.accountId ? { accountId: input.accountId } : {}),
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.clientSecret
          ? { clientSecretCiphertext: encryptClassroomSecret(input.clientSecret) }
          : {}),
        ...(input.sdkKey ? { sdkKey: input.sdkKey } : {}),
        ...(input.sdkSecret
          ? { sdkSecretCiphertext: encryptClassroomSecret(input.sdkSecret) }
          : {}),
        ...(input.hostUserId !== undefined
          ? { hostUserId: input.hostUserId || "me" }
          : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(credentialsChanged ? { lastVerifiedAt: null } : {}),
      },
      select: publicSelect,
    });
  });
  if (credentialsChanged) {
    forgetZoomAccessToken({ ...existing, clientSecret: "" });
  }
  return toPublic(row);
}

export async function deleteZoomAccount(id: string): Promise<void> {
  const row = await prisma.zoomAccount.findUnique({
    where: { id },
    select: { isDefault: true, _count: { select: { liveSessions: true } } },
  });
  if (!row) throw new ZoomAccountError("NOT_FOUND", 404);
  if (row._count.liveSessions > 0) {
    throw new ZoomAccountError("ACCOUNT_IN_USE", 409);
  }
  await prisma.$transaction(async (tx) => {
    await tx.zoomAccount.delete({ where: { id } });
    if (row.isDefault) {
      const next = await tx.zoomAccount.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next) {
        await tx.zoomAccount.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
}

async function loadAccount(where: { id: string } | { isDefault: true }) {
  const row = await prisma.zoomAccount.findFirst({
    where,
    select: {
      id: true,
      accountId: true,
      clientId: true,
      clientSecretCiphertext: true,
      sdkKey: true,
      sdkSecretCiphertext: true,
      hostUserId: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    hostUserId: row.hostUserId || "me",
    oauth: {
      accountId: row.accountId,
      clientId: row.clientId,
      clientSecret: decryptClassroomSecret(row.clientSecretCiphertext),
    },
    sdk: {
      sdkKey: row.sdkKey,
      sdkSecret: decryptClassroomSecret(row.sdkSecretCiphertext),
    },
  } satisfies ResolvedZoomAccount;
}

/** Account used to create new meetings: explicit id → default account. */
export async function resolveZoomAccountForCreate(
  preferredId: string | null | undefined,
): Promise<ResolvedZoomAccount & { id: string }> {
  const account = preferredId
    ? await loadAccount({ id: preferredId })
    : await loadAccount({ isDefault: true });
  if (!account) throw new ZoomAccountError("ZOOM_ACCOUNT_REQUIRED", 409);
  return account;
}

/** Managed account by id (meetings created by WEWIN). */
export async function resolveZoomAccountById(
  id: string,
): Promise<ResolvedZoomAccount & { id: string }> {
  const account = await loadAccount({ id });
  if (!account) throw new ZoomAccountError("NOT_FOUND", 404);
  return account;
}

/**
 * Credentials for joining a session: its own account when WEWIN created the
 * meeting; otherwise legacy env credentials, then the default account.
 */
export async function resolveZoomAccountForSession(
  zoomAccountId: string | null,
): Promise<ResolvedZoomAccount> {
  if (zoomAccountId) return resolveZoomAccountById(zoomAccountId);
  const envOAuth = envZoomOAuthCredentials();
  const envSdk = envMeetingSdkCredentials();
  if (envSdk) {
    return {
      id: null,
      hostUserId: process.env.ZOOM_HOST_USER_ID?.trim() || "me",
      oauth: envOAuth,
      sdk: envSdk,
    };
  }
  const fallback = await loadAccount({ isDefault: true });
  return fallback ?? { id: null, hostUserId: "me", oauth: null, sdk: null };
}

/** Fetches an OAuth token and a host ZAK to prove credentials and scopes work. */
export async function verifyZoomAccount(
  id: string,
): Promise<{ ok: true } | { ok: false; code: string; detail?: string }> {
  const account = await resolveZoomAccountById(id);
  if (!account.oauth) return { ok: false, code: "ZOOM_OAUTH_FAILED" };
  try {
    forgetZoomAccessToken(account.oauth);
    await getZoomHostZak(account.oauth, account.hostUserId);
    await prisma.zoomAccount.update({
      where: { id },
      data: { lastVerifiedAt: new Date() },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ZoomApiError) {
      return { ok: false, code: error.code, detail: error.zoomMessage };
    }
    return { ok: false, code: "ZOOM_API_FAILED" };
  }
}
