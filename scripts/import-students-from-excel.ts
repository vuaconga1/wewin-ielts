/**
 * Import student accounts from Students_DiemDanh_Extract_*.xlsx
 * username = Mã HV, fullName = Họ tên, classCode = Class (joined if multi), role = STUDENT
 * Default password for NEW accounts: wewin123
 *
 * Usage: npx tsx scripts/import-students-from-excel.ts [path-to-xlsx]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const DEFAULT_XLSX =
  process.argv[2] ||
  "E:\\Active\\Students_DiemDanh_Extract_20260924_172512.xlsx";
const DEFAULT_PASSWORD = "wewin123";

type StudentRow = {
  maHv: string;
  fullName: string;
  classCodes: string[];
};

function readStudents(xlsxPath: string): StudentRow[] {
  const py = `
import openpyxl, json, sys
from collections import defaultdict
path = sys.argv[1]
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
ws = wb['Students']
by = defaultdict(lambda: {'names': set(), 'classes': set()})
for r in ws.iter_rows(min_row=2, values_only=True):
    if not r or not r[3]:
        continue
    ma = str(r[3]).strip()
    ten = str(r[4]).strip() if r[4] else ''
    cl = str(r[2]).strip() if r[2] else ''
    if not ma or not ten:
        continue
    by[ma]['names'].add(ten)
    if cl:
        by[ma]['classes'].add(cl)
wb.close()
out = []
for ma, info in by.items():
    names = sorted(info['names'])
    out.append({
        'maHv': ma,
        'fullName': names[0],
        'classCodes': sorted(info['classes']),
    })
print(json.dumps(out, ensure_ascii=False))
`;
  const result = spawnSync("python", ["-c", py, xlsxPath], {
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Failed to read Excel");
  }
  return JSON.parse(result.stdout) as StudentRow[];
}

async function main() {
  const xlsxPath = path.resolve(DEFAULT_XLSX);
  console.log("Reading", xlsxPath);
  const students = readStudents(xlsxPath);
  console.log(`Unique students: ${students.length}`);

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of students) {
    const username = s.maHv.trim().slice(0, 64);
    const fullName = s.fullName.trim().slice(0, 120) || null;
    const classCode =
      s.classCodes.length > 0 ? s.classCodes.join(", ").slice(0, 200) : null;

    try {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName,
            classCode,
            role: existing.role === "ADMIN" ? "ADMIN" : "STUDENT",
          },
        });
        updated += 1;
      } else {
        await prisma.user.create({
          data: {
            username,
            fullName,
            classCode,
            passwordHash,
            role: "STUDENT",
            email: null,
          },
        });
        created += 1;
      }
    } catch (e) {
      skipped += 1;
      errors.push(`${username}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  await prisma.$disconnect();

  console.log("---");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${skipped}`);
  console.log(`Default password for new accounts: ${DEFAULT_PASSWORD}`);
  if (errors.length) {
    console.log("First errors:");
    for (const err of errors.slice(0, 10)) console.log(" ", err);
  }
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
