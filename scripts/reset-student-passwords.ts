/**
 * Reset all STUDENT passwords to a shared default (default: 123).
 * Usage: npx tsx scripts/reset-student-passwords.ts [password]
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const password = process.argv[2] || "123";

async function main() {
  if (password.length < 3) {
    throw new Error("Password must be at least 3 characters");
  }
  console.log(`Resetting STUDENT passwords to: ${password}`);
  const passwordHash = await hashPassword(password);
  const result = await prisma.user.updateMany({
    where: { role: "STUDENT" },
    data: { passwordHash },
  });
  console.log(`Updated ${result.count} student accounts.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
