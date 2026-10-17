import fs from "node:fs";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const store = fs.readFileSync("src/lib/store/test-store.ts", "utf8");
const persist = fs.readFileSync("src/lib/import/persist.ts", "utf8");

for (const expected of [
  'revalidateTag("tests-catalog")',
  'revalidatePath("/tests")',
  'revalidatePath("/tests/general")',
  'revalidatePath("/tests/academic")',
  'revalidatePath("/tests/placement")',
]) {
  assert(store.includes(expected), `catalog invalidation is missing ${expected}`);
}

assert(
  /await prisma\.importJob\.update\([\s\S]*?invalidateTestCatalogCache\(\);[\s\S]*?return \{/.test(persist),
  "successful DB persistence must invalidate the catalog before returning",
);

console.log("catalog invalidation: ok");
