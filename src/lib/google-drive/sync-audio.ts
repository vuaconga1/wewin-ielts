/**
 * Recursive Google Drive audio pull → public/uploads/audio/
 * Attaches paths to local Listening test drafts (and optional MediaAsset).
 */

import { access, stat } from "node:fs/promises";
import path from "node:path";
import { previewAudioByDriveId, saveAudioByDriveId } from "@/lib/import/audio";
import { slugify } from "@/lib/import/detect-skill";
import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { listTests, saveTestDraft, type StoredTest } from "@/lib/store/test-store";
import type { drive_v3 } from "googleapis";
import {
  downloadDriveFile,
  getDriveClient,
  getDriveCredentialsStatus,
  getDriveFolderMeta,
  listDriveChildren,
  type DriveListedFile,
} from "./client";
import { parseDriveFolderId } from "./folder-id";

const AUDIO_EXT = /\.(mp3|m4a|wav|ogg)$/i;
const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_DEPTH = 10;

export type DriveAudioFileHit = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  parentFolderId: string;
  parentFolderName: string;
  folderPath: string;
  ancestorFolderIds: string[];
};

export type DriveAudioDownloadResult = {
  driveFileId: string;
  name: string;
  folderPath: string;
  status: "downloaded" | "skipped_exists" | "error";
  relativeUrl?: string;
  absolutePath?: string;
  bytes?: number;
  error?: string;
  attachedSlug?: string;
};

export type DriveAudioSyncResult = {
  rootFolderId: string;
  rootFolderName: string;
  found: number;
  downloaded: number;
  skippedExisting: number;
  failed: number;
  attachedTests: { slug: string; audioFiles: string[]; count: number }[];
  orphaned: { name: string; folderPath: string; relativeUrl?: string }[];
  files: DriveAudioDownloadResult[];
};

function isAudioFile(file: Pick<DriveListedFile, "name" | "mimeType">): boolean {
  return AUDIO_EXT.test(file.name) || file.mimeType.startsWith("audio/");
}

async function listChildrenWithSize(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<(DriveListedFile & { sizeBytes?: number })[]> {
  const out: (DriveListedFile & { sizeBytes?: number })[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size)",
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name) continue;
      out.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType ?? "application/octet-stream",
        isFolder: f.mimeType === FOLDER_MIME,
        sizeBytes: f.size ? Number(f.size) : undefined,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/**
 * Walk folder tree and collect every audio file (mp3/m4a/wav/ogg).
 */
export async function listDriveAudioRecursive(
  drive: drive_v3.Drive,
  rootFolderId: string,
  rootFolderName: string,
): Promise<DriveAudioFileHit[]> {
  const hits: DriveAudioFileHit[] = [];

  async function walk(
    folderId: string,
    folderName: string,
    folderPath: string,
    ancestors: string[],
    depth: number,
  ) {
    if (depth > MAX_DEPTH) return;
    const children = await listChildrenWithSize(drive, folderId);
    const nextAncestors = [...ancestors, folderId];

    for (const child of children) {
      if (child.isFolder) {
        await walk(
          child.id,
          child.name,
          folderPath ? `${folderPath}/${child.name}` : child.name,
          nextAncestors,
          depth + 1,
        );
        continue;
      }
      if (!isAudioFile(child)) continue;
      hits.push({
        id: child.id,
        name: child.name,
        mimeType: child.mimeType,
        sizeBytes: child.sizeBytes,
        parentFolderId: folderId,
        parentFolderName: folderName,
        folderPath: folderPath || rootFolderName,
        ancestorFolderIds: nextAncestors,
      });
    }
  }

  await walk(rootFolderId, rootFolderName, rootFolderName, [], 0);
  return hits;
}

function listeningSlugForFolderName(folderName: string): string {
  return `${slugify(folderName)}-listening`;
}

function matchListeningTest(
  hit: DriveAudioFileHit,
  byDriveFolderId: Map<string, StoredTest>,
  bySlug: Map<string, StoredTest>,
): StoredTest | undefined {
  for (let i = hit.ancestorFolderIds.length - 1; i >= 0; i -= 1) {
    const id = hit.ancestorFolderIds[i];
    const match = byDriveFolderId.get(id);
    if (match) return match;
  }

  // Walk path segments: "IELTS/Test 8/Listening" → try Test 8, Listening, …
  const parts = hit.folderPath.split("/").filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const slug = listeningSlugForFolderName(parts[i]);
    const match = bySlug.get(slug);
    if (match) return match;
  }

  return undefined;
}

async function fileExistsWithSize(
  absolutePath: string,
  expectedBytes?: number,
): Promise<boolean> {
  try {
    await access(absolutePath);
    if (expectedBytes == null || !Number.isFinite(expectedBytes)) return true;
    const st = await stat(absolutePath);
    return st.size === expectedBytes;
  } catch {
    return false;
  }
}

async function patchDbMediaAssets(slug: string, audioFiles: string[]) {
  if (!(await canUsePrisma())) return;
  const test = await prisma.test.findUnique({ where: { slug } });
  if (!test) return;

  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.deleteMany({
      where: { testId: test.id, type: "AUDIO" },
    });
    for (const filePath of audioFiles) {
      await tx.mediaAsset.create({
        data: {
          testId: test.id,
          type: "AUDIO",
          path: filePath,
          label: filePath.split(/[/\\]/).pop(),
        },
      });
    }
  });
}

/**
 * Download all audio under a Drive folder tree and attach to Listening drafts.
 */
export async function syncDriveAudio(input: {
  folderIdOrUrl: string;
  /** Also write MediaAsset rows when the test exists in DB */
  persist?: boolean;
  /** Re-download even if a same-sized local file already exists */
  force?: boolean;
}): Promise<DriveAudioSyncResult> {
  const creds = getDriveCredentialsStatus();
  if (!creds.configured) {
    throw new Error(
      creds.message ?? "Chưa cấu hình GOOGLE_SERVICE_ACCOUNT_JSON.",
    );
  }

  const folderId = parseDriveFolderId(input.folderIdOrUrl);
  if (!folderId) {
    throw new Error(
      "Folder ID/URL không hợp lệ. Dùng https://drive.google.com/drive/folders/FOLDER_ID hoặc dán FOLDER_ID.",
    );
  }

  const drive = await getDriveClient();
  const root = await getDriveFolderMeta(drive, folderId);
  const hits = await listDriveAudioRecursive(drive, root.id, root.name);

  const tests = await listTests();
  const listening = tests.filter((t) => t.skill === "LISTENING");
  const byDriveFolderId = new Map<string, StoredTest>();
  const bySlug = new Map<string, StoredTest>();

  for (const t of listening) {
    bySlug.set(t.slug, t);
    if (t.driveFolderId) byDriveFolderId.set(t.driveFolderId, t);
    const m = t.sourceFolder?.match(/^drive:([^:]+):/);
    if (m?.[1]) byDriveFolderId.set(m[1], t);
  }

  /** slug → ordered unique relative URLs */
  const attachMap = new Map<string, string[]>();
  const files: DriveAudioDownloadResult[] = [];
  let downloaded = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (const hit of hits) {
    const matched = matchListeningTest(hit, byDriveFolderId, bySlug);
    const preview = previewAudioByDriveId(hit.name, hit.id);

    try {
      if (
        !input.force &&
        (await fileExistsWithSize(preview.absolutePath, hit.sizeBytes))
      ) {
        skippedExisting += 1;
        const row: DriveAudioDownloadResult = {
          driveFileId: hit.id,
          name: hit.name,
          folderPath: hit.folderPath,
          status: "skipped_exists",
          relativeUrl: preview.relativeUrl,
          absolutePath: preview.absolutePath,
          bytes: hit.sizeBytes,
          attachedSlug: matched?.slug,
        };
        files.push(row);
        if (matched) {
          const list = attachMap.get(matched.slug) ?? [];
          if (!list.includes(preview.relativeUrl)) list.push(preview.relativeUrl);
          attachMap.set(matched.slug, list);
        }
        continue;
      }

      const buf = await downloadDriveFile(drive, hit);
      const saved = await saveAudioByDriveId(buf.buffer, hit.name, hit.id);
      downloaded += 1;
      const row: DriveAudioDownloadResult = {
        driveFileId: hit.id,
        name: hit.name,
        folderPath: hit.folderPath,
        status: "downloaded",
        relativeUrl: saved.relativeUrl,
        absolutePath: saved.absolutePath,
        bytes: buf.buffer.length,
        attachedSlug: matched?.slug,
      };
      files.push(row);
      if (matched) {
        const list = attachMap.get(matched.slug) ?? [];
        if (!list.includes(saved.relativeUrl)) list.push(saved.relativeUrl);
        attachMap.set(matched.slug, list);
      }
    } catch (e) {
      failed += 1;
      files.push({
        driveFileId: hit.id,
        name: hit.name,
        folderPath: hit.folderPath,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        attachedSlug: matched?.slug,
      });
    }
  }

  const attachedTests: DriveAudioSyncResult["attachedTests"] = [];
  const orphaned: DriveAudioSyncResult["orphaned"] = [];

  for (const row of files) {
    if (!row.attachedSlug && row.relativeUrl) {
      orphaned.push({
        name: row.name,
        folderPath: row.folderPath,
        relativeUrl: row.relativeUrl,
      });
    }
  }

  for (const [slug, urls] of attachMap) {
    const sorted = [...urls].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    const existing = bySlug.get(slug);
    if (existing) {
      const driveFileIds = { ...(existing.driveFileIds ?? {}) };
      for (const row of files) {
        if (row.attachedSlug === slug && row.relativeUrl) {
          driveFileIds[path.basename(row.name)] = row.driveFileId;
        }
      }
      await saveTestDraft({
        ...existing,
        audioFiles: sorted,
        driveFileIds,
      });
      if (input.persist) {
        try {
          await patchDbMediaAssets(slug, sorted);
        } catch {
          // Local JSON is source of truth when DB patch fails
        }
      }
    }
    attachedTests.push({ slug, audioFiles: sorted, count: sorted.length });
  }

  attachedTests.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

  return {
    rootFolderId: root.id,
    rootFolderName: root.name,
    found: hits.length,
    downloaded,
    skippedExisting,
    failed,
    attachedTests,
    orphaned,
    files,
  };
}

/** Used when listing children without size (fallback via listDriveChildren). */
export async function listDriveAudioShallow(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<DriveListedFile[]> {
  const children = await listDriveChildren(drive, folderId);
  return children.filter((c) => !c.isFolder && isAudioFile(c));
}
