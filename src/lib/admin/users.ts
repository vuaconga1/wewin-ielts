/**
 * Admin user CRUD — Prisma when available, else local user-store.
 * Never returns passwordHash.
 */

import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import {
  deleteLocalUser,
  findLocalUserByEmail,
  findLocalUserById,
  findLocalUserByUsername,
  listLocalUsers,
  updateLocalUser,
  upsertLocalUser,
  type StoredUser,
} from "@/lib/store/user-store";

export type AdminUserRole = "ADMIN" | "STUDENT";

export type AdminUserPublic = {
  id: string;
  email: string | null;
  username: string;
  fullName: string | null;
  classCode: string | null;
  role: AdminUserRole;
  avatarUrl: string | null;
  createdAt: string;
};

export class AdminUsersError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function toPublic(user: {
  id: string;
  email: string | null;
  username: string;
  fullName?: string | null;
  classCode?: string | null;
  role: AdminUserRole;
  avatarUrl?: string | null;
  createdAt: Date | string;
}): AdminUserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName ?? null,
    classCode: user.classCode ?? null,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    createdAt:
      typeof user.createdAt === "string"
        ? user.createdAt
        : user.createdAt.toISOString(),
  };
}

function localToPublic(user: StoredUser): AdminUserPublic {
  return toPublic(user);
}

/** Empty / whitespace → null; otherwise trimmed lowercase. */
function normalizeOptionalEmail(email: string | null | undefined): string | null {
  const trimmed = (email ?? "").trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function normalizeUsername(username: string): string {
  return username.trim().slice(0, 64);
}

function normalizeOptionalText(
  value: string | null | undefined,
  max = 120,
): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function assertEmail(email: string) {
  if (!email.includes("@")) {
    throw new AdminUsersError("INVALID_EMAIL", "Email không hợp lệ");
  }
}

function assertUsername(username: string) {
  if (!username || username.length < 2) {
    throw new AdminUsersError(
      "INVALID_USERNAME",
      "Username cần ít nhất 2 ký tự",
    );
  }
}

function assertPassword(password: string) {
  if (password.length < 3) {
    throw new AdminUsersError(
      "WEAK_PASSWORD",
      "Mật khẩu cần ít nhất 3 ký tự",
    );
  }
}

function assertRole(role: string): asserts role is AdminUserRole {
  if (role !== "ADMIN" && role !== "STUDENT") {
    throw new AdminUsersError("INVALID_ROLE", "Role phải là STUDENT hoặc ADMIN");
  }
}

const userPublicSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  classCode: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export async function listAdminUsers(): Promise<AdminUserPublic[]> {
  return unstable_cache(
    async () => {
      if (await canUsePrisma()) {
        const users = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 2000,
          select: userPublicSelect,
        });
        return users.map(toPublic);
      }

      const local = await listLocalUsers();
      return local
        .map(localToPublic)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 2000);
    },
    ["admin-users-list-v2"],
    { revalidate: 15 },
  )();
}

export async function createAdminUser(input: {
  email?: string | null;
  username: string;
  password: string;
  role: string;
  fullName?: string | null;
  classCode?: string | null;
}): Promise<AdminUserPublic> {
  const email = normalizeOptionalEmail(input.email);
  const username = normalizeUsername(input.username);
  const password = input.password;
  const fullName = normalizeOptionalText(input.fullName, 120);
  const classCode = normalizeOptionalText(input.classCode, 200);
  if (email) assertEmail(email);
  assertUsername(username);
  assertPassword(password);
  assertRole(input.role);
  const role = input.role;

  const passwordHash = await hashPassword(password);

  if (await canUsePrisma()) {
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new AdminUsersError("EMAIL_TAKEN", "Email đã được đăng ký");
      }
    }
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new AdminUsersError("USERNAME_TAKEN", "Username đã được dùng");
    }
    const user = await prisma.user.create({
      data: { email, username, passwordHash, role, fullName, classCode },
      select: userPublicSelect,
    });
    return toPublic(user);
  }

  if (email && (await findLocalUserByEmail(email))) {
    throw new AdminUsersError("EMAIL_TAKEN", "Email đã được đăng ký");
  }
  if (await findLocalUserByUsername(username)) {
    throw new AdminUsersError("USERNAME_TAKEN", "Username đã được dùng");
  }
  const created = await upsertLocalUser({
    email,
    username,
    passwordHash,
    role,
    fullName,
    classCode,
  });
  return localToPublic(created);
}

export async function updateAdminUser(
  id: string,
  input: {
    username?: string;
    role?: string;
    password?: string;
    fullName?: string | null;
    classCode?: string | null;
  },
): Promise<AdminUserPublic> {
  if (!id) {
    throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }

  const patch: {
    username?: string;
    role?: AdminUserRole;
    passwordHash?: string;
    fullName?: string | null;
    classCode?: string | null;
  } = {};

  if (input.username != null) {
    const username = normalizeUsername(input.username);
    assertUsername(username);
    patch.username = username;
  }
  if (input.role != null) {
    assertRole(input.role);
    patch.role = input.role;
  }
  if (input.password != null && input.password !== "") {
    assertPassword(input.password);
    patch.passwordHash = await hashPassword(input.password);
  }
  if (input.fullName !== undefined) {
    patch.fullName = normalizeOptionalText(input.fullName, 120);
  }
  if (input.classCode !== undefined) {
    patch.classCode = normalizeOptionalText(input.classCode, 200);
  }

  if (
    patch.username == null &&
    patch.role == null &&
    patch.passwordHash == null &&
    patch.fullName === undefined &&
    patch.classCode === undefined
  ) {
    throw new AdminUsersError("NO_CHANGES", "Không có thay đổi nào");
  }

  if (await canUsePrisma()) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
    }
    if (patch.username && patch.username !== existing.username) {
      const taken = await prisma.user.findUnique({
        where: { username: patch.username },
      });
      if (taken) {
        throw new AdminUsersError("USERNAME_TAKEN", "Username đã được dùng");
      }
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(patch.username != null ? { username: patch.username } : {}),
        ...(patch.role != null ? { role: patch.role } : {}),
        ...(patch.passwordHash != null
          ? { passwordHash: patch.passwordHash }
          : {}),
        ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}),
        ...(patch.classCode !== undefined
          ? { classCode: patch.classCode }
          : {}),
      },
      select: userPublicSelect,
    });
    return toPublic(user);
  }

  const existing = await findLocalUserById(id);
  if (!existing) {
    throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }
  if (patch.username && patch.username !== existing.username) {
    const taken = await findLocalUserByUsername(patch.username);
    if (taken && taken.id !== id) {
      throw new AdminUsersError("USERNAME_TAKEN", "Username đã được dùng");
    }
  }
  const updated = await updateLocalUser(id, patch);
  if (!updated) {
    throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }
  return localToPublic(updated);
}

export async function deleteAdminUser(
  id: string,
  actorId: string | null,
): Promise<void> {
  if (!id) {
    throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }
  if (actorId && id === actorId) {
    throw new AdminUsersError(
      "CANNOT_DELETE_SELF",
      "Không thể xóa tài khoản đang đăng nhập",
      400,
    );
  }

  if (await canUsePrisma()) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
    }
    await prisma.user.delete({ where: { id } });
    return;
  }

  const ok = await deleteLocalUser(id);
  if (!ok) {
    throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }
}
