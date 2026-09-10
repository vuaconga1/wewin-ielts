/**
 * Demo practice seeding has been removed.
 *
 * Practice catalog should only contain Google Drive imports
 * (`sourceFolder` starts with `drive:`). To wipe leftover local demos:
 *
 *   npx tsx scripts/cleanup-demo-practice.ts
 *
 * To import real tests: use Admin → Import (Drive sync) or
 * `npx tsx scripts/import-test.ts` with real files (prefer Drive).
 *
 * Admin user seed is unchanged: `npm run seed:admin`
 */

console.error(
  [
    "seed-practice: demo practice seeding is disabled.",
    "Use Drive sync / admin import for luyện đề content.",
    "To remove leftover demos: npx tsx scripts/cleanup-demo-practice.ts",
  ].join("\n"),
);
process.exit(1);
