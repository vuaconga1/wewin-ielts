/**
 * Pull all Listening audio (.mp3/.m4a/.wav/.ogg) from a Google Drive folder tree
 * into public/uploads/audio/ and attach paths to local Listening test drafts.
 *
 * Usage:
 *   npx tsx scripts/sync-drive-audio.ts
 *   npx tsx scripts/sync-drive-audio.ts --folder 1YOq1oW3VXtBo0451f2zD7diEwtMknE9G
 *   npx tsx scripts/sync-drive-audio.ts --folder <URL|ID> --persist --force
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_JSON=./secrets/google-service-account.json
 *   GOOGLE_DRIVE_FOLDER_ID=<default folder>
 */

import "dotenv/config";
import { syncDriveAudio } from "../src/lib/google-drive";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const folder =
    arg("folder") ??
    process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ??
    "1YOq1oW3VXtBo0451f2zD7diEwtMknE9G";

  console.log(`Sync Drive audio from: ${folder}`);
  console.log(`persist=${hasFlag("persist")} force=${hasFlag("force")}`);

  const result = await syncDriveAudio({
    folderIdOrUrl: folder,
    persist: hasFlag("persist"),
    force: hasFlag("force"),
  });

  console.log("\n=== Summary ===");
  console.log(`Root: ${result.rootFolderName} (${result.rootFolderId})`);
  console.log(`Found:            ${result.found}`);
  console.log(`Downloaded:       ${result.downloaded}`);
  console.log(`Skipped (exists): ${result.skippedExisting}`);
  console.log(`Failed:           ${result.failed}`);
  console.log(`Listening tests updated: ${result.attachedTests.length}`);
  console.log(`Orphaned (no Listening match): ${result.orphaned.length}`);

  if (result.attachedTests.length) {
    console.log("\n--- Attached ---");
    for (const t of result.attachedTests) {
      console.log(`  ${t.slug}: ${t.count} file(s)`);
      for (const u of t.audioFiles) console.log(`    ${u}`);
    }
  }

  if (result.orphaned.length) {
    console.log("\n--- Orphaned ---");
    for (const o of result.orphaned) {
      console.log(`  [${o.folderPath}] ${o.name} → ${o.relativeUrl ?? "?"}`);
    }
  }

  const errors = result.files.filter((f) => f.status === "error");
  if (errors.length) {
    console.log("\n--- Failures ---");
    for (const e of errors) {
      console.log(`  [${e.folderPath}] ${e.name}: ${e.error}`);
    }
  }

  if (result.failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
