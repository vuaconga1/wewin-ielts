/**
 * Seed default admin user.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *   npm run seed:admin
 *
 * Env (optional):
 *   ADMIN_EMAIL=admin@wewin.local
 *   ADMIN_PASSWORD=change-me
 *   ADMIN_USERNAME=admin
 *
 * When MySQL is unavailable / placeholder DATABASE_* → writes data/users.json
 * (same local fallback used for tests/attempts).
 */

import "dotenv/config";
import { hashPassword } from "../src/lib/auth";
import { canUsePrisma } from "../src/lib/db";
import { prisma } from "../src/lib/prisma";
import { upsertLocalUser } from "../src/lib/store/user-store";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@wewin.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me";
  const username = process.env.ADMIN_USERNAME ?? "admin";

  if (password === "change-me") {
    console.warn(
      "⚠ Using default password 'change-me' — set ADMIN_PASSWORD before production.",
    );
  }

  const passwordHash = await hashPassword(password);

  if (await canUsePrisma()) {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        username,
        passwordHash,
        role: "ADMIN",
      },
      update: {
        passwordHash,
        role: "ADMIN",
        username,
      },
    });

    console.log(`Admin ready (Neon/Postgres): ${user.email} (id=${user.id}, role=${user.role})`);
    console.log("Login at /login");
    return;
  }

  const user = await upsertLocalUser({
    email,
    username,
    passwordHash,
    role: "ADMIN",
  });

  console.log(
    `Admin ready (local JSON data/users.json): ${user.email} (id=${user.id}, role=${user.role})`,
  );
  console.log(
    "Neon chưa sẵn sàng — dùng local auth. Khi có Neon: set DATABASE_URL, rồi prisma db push + npm run seed:admin.",
  );
  console.log("Login at /login with admin@wewin.local / change-me");
}

main()
  .catch((e) => {
    console.error(e);
    console.error("\nSeed failed. Check DATABASE_* or filesystem write access to data/.");
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore when never connected
    }
  });
