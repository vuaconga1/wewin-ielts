import { prisma } from "../src/lib/prisma";

const WRAP = /\s*\(\s*Đã báo mã HV\s*\)\s*/gi;

async function main() {
  const users = await prisma.user.findMany({
    where: { fullName: { contains: "Đã báo mã HV" } },
    select: { id: true, fullName: true },
  });
  console.log("matches", users.length);
  let updated = 0;
  for (const u of users) {
    if (!u.fullName) continue;
    const next = u.fullName.replace(WRAP, " ").replace(/\s+/g, " ").trim();
    if (next === u.fullName) {
      console.log("unchanged sample:", JSON.stringify(u.fullName));
      continue;
    }
    await prisma.user.update({
      where: { id: u.id },
      data: { fullName: next || null },
    });
    updated += 1;
  }
  console.log("updated", updated);
  const left = await prisma.user.count({
    where: { fullName: { contains: "Đã báo mã HV" } },
  });
  console.log("remaining", left);
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
