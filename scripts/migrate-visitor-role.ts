/**
 * STUDENT accounts without a class become VISITOR ("Khách").
 * Run after the add_visitor_role migration. Dry-run by default; pass --apply to write.
 *
 *   npx tsx scripts/migrate-visitor-role.ts [--apply]
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const APPLY = process.argv.includes("--apply");

async function main() {
  const where = {
    role: "STUDENT" as const,
    OR: [{ classCode: null }, { classCode: "" }, { classCode: { equals: " " } }],
  };
  const users = await prisma.user.findMany({
    where,
    select: { username: true, email: true, classCode: true },
  });
  const noClass = users.filter((u) => !(u.classCode ?? "").trim());
  for (const u of noClass) console.log(`STUDENT -> VISITOR  ${u.username}  ${u.email ?? "-"}`);
  console.log(`${noClass.length} account(s)`);
  if (!APPLY) {
    console.log("Dry run. Re-run with --apply to write.");
    return;
  }
  const res = await prisma.user.updateMany({
    where: { role: "STUDENT", username: { in: noClass.map((u) => u.username) } },
    data: { role: "VISITOR" },
  });
  console.log(`Updated ${res.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
