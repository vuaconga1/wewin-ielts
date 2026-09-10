/**
 * Admin user CRUD — Prisma when available, else local user-store.
 * Never returns passwordHash.
 */

import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
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
  email: string;
  username: string;
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
  email: string;
  username: string;
  role: AdminUserRole;
  avatarUrl?: string | null;
  createdAt: Date | string;
}): AdminUserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
  return username.trim().slice(0, 48);
}

function assertEmail(email: string) {
  if (!email || !email.includes("@")) {
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
  if (password.length < 6) {
    throw new AdminUsersError(
      "WEAK_PASSWORD",
      "Mật khẩu cần ít nhất 6 ký tự",
    );
  }
}

function assertRole(role: string): asserts role is AdminUserRole {
  if (role !== "ADMIN" && role !== "STUDENT") {
    throw new AdminUsersError("INVALID_ROLE", "Role phải là STUDENT hoặc ADMIN");
  }
}

export async function listAdminUsers(): Promise<AdminUserPublic[]> {
  if (await canUsePrisma()) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    return users.map(toPublic);
  }

  const local = await listLocalUsers();
  return local
    .map(localToPublic)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAdminUser(input: {
  email: string;
  username: string;
  password: string;
  role: string;
}): Promise<AdminUserPublic> {
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  const password = input.password;
  assertEmail(email);
  assertUsername(username);
  assertPassword(password);
  assertRole(input.role);
  const role = input.role;

  const passwordHash = await hashPassword(password);

  if (await canUsePrisma()) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AdminUsersError("EMAIL_TAKEN", "Email đã được đăng ký");
    }
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new AdminUsersError("USERNAME_TAKEN", "Username đã được dùng");
    }
    const user = await prisma.user.create({
      data: { email, username, passwordHash, role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    return toPublic(user);
  }

  if (await findLocalUserByEmail(email)) {
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
  });
  return localToPublic(created);
}

export async function updateAdminUser(
  id: string,
  input: {
    username?: string;
    role?: string;
    password?: string;
  },
): Promise<AdminUserPublic> {
  if (!id) {
    throw new AdminUsersError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }

  const patch: {
    username?: string;
    role?: AdminUserRole;
    passwordHash?: string;
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

  if (
    patch.username == null &&
    patch.role == null &&
    patch.passwordHash == null
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
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
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
