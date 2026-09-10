/**
 * Sync IELTS test folder(s) from Google Drive into the import pipeline.
 */

import { saveAudioByDriveId, saveAudioUpload } from "@/lib/import/audio";
import {
  parseBatchFiles,
  type BatchFile,
  type BatchImportItemResult,
} from "@/lib/import/batch";
import { persistParsedTest } from "@/lib/import/persist";
import type { ImportIssue } from "@/lib/import/schemas";
import { slugify } from "@/lib/import/detect-skill";
import { getTestBySlug, saveTestDraft } from "@/lib/store/test-store";
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

const CONTENT_EXT = /\.(docx|md|txt|csv)$/i;
const AUDIO_EXT = /\.(mp3|m4a|wav|ogg)$/i;
const SKILL_OR_KEYS =
  /(listening|reading|writing|speaking|keys?|keyss|đáp\s*án|dap\s*an|answer)/i;

export type DriveSyncItemResult = {
  sourceName: string;
  slug?: string;
  title?: string;
  skill?: string;
  practiceUrl?: string;
  status: "new" | "updated" | "error" | "skipped";
  issues: ImportIssue[];
  audioAttached?: string[];
};

export type DriveSyncFolderResult = {
  folderId: string;
  folderName: string;
  status: "ok" | "error" | "skipped";
  error?: string;
  items: DriveSyncItemResult[];
  saved: { slug: string; practiceUrl: string; title: string; status: "new" | "updated" }[];
};

export type DriveSyncResult = {
  rootFolderId: string;
  rootFolderName: string;
  folders: DriveSyncFolderResult[];
  newCount: number;
  updatedCount: number;
  errorCount: number;
  skippedCount: number;
  issues: ImportIssue[];
};

function looksLikeImportFile(name: string): boolean {
  if (AUDIO_EXT.test(name)) return true;
  if (!CONTENT_EXT.test(name) && !/\.gdoc$/i.test(name)) {
    // Native Google Docs often have no extension
    return SKILL_OR_KEYS.test(name);
  }
  return SKILL_OR_KEYS.test(name) || CONTENT_EXT.test(name);
}

function folderHasTestFiles(files: DriveListedFile[]): boolean {
  return files.some((f) => !f.isFolder && looksLikeImportFile(f.name));
}

/**
 * Collect downloadable files in a test folder (includes one nested level, e.g. Speaking/).
 */
async function collectTestFiles(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<DriveListedFile[]> {
  const children = await listDriveChildren(drive, folderId);
  const files: DriveListedFile[] = [];

  for (const child of children) {
    if (!child.isFolder) {
      files.push(child);
      continue;
    }
    const nested = await listDriveChildren(drive, child.id);
    for (const n of nested) {
      if (!n.isFolder) files.push(n);
    }
  }

  return files;
}

async function downloadAsBatchFiles(
  drive: drive_v3.Drive,
  files: DriveListedFile[],
): Promise<{ batch: BatchFile[]; driveFileIds: Record<string, string> }> {
  const batch: BatchFile[] = [];
  const driveFileIds: Record<string, string> = {};

  for (const file of files) {
    if (file.mimeType === "application/vnd.google-apps.folder") continue;
    // Skip non-import noise (images, PDF screenshots, etc.) unless named as keys/skill
    const isAudio = AUDIO_EXT.test(file.name) || file.mimeType.startsWith("audio/");
    const isGoogleDoc =
      file.mimeType === "application/vnd.google-apps.document" ||
      file.mimeType === "application/vnd.google-apps.spreadsheet";
    const isOffice =
      /\.(docx|md|txt|csv)$/i.test(file.name) ||
      file.mimeType.includes("wordprocessingml") ||
      file.mimeType.includes("officedocument");

    if (!isAudio && !isGoogleDoc && !isOffice && !SKILL_OR_KEYS.test(file.name)) {
      continue;
    }

    try {
      const downloaded = await downloadDriveFile(drive, file);
      batch.push({ name: downloaded.name, buffer: downloaded.buffer });
      driveFileIds[downloaded.name] = file.id;
    } catch (e) {
      // Surface later via issues on empty batch
      throw new Error(
        `Không tải được "${file.name}": ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return { batch, driveFileIds };
}

async function syncOneTestFolder(
  drive: drive_v3.Drive,
  folder: { id: string; name: string },
  options: { persist: boolean; force: boolean },
): Promise<DriveSyncFolderResult> {
  const listed = await collectTestFiles(drive, folder.id);
  if (!folderHasTestFiles(listed)) {
    return {
      folderId: folder.id,
      folderName: folder.name,
      status: "skipped",
      error: "Không có file đề / keys / audio nhận diện được.",
      items: [],
      saved: [],
    };
  }

  let batch: BatchFile[];
  let driveFileIds: Record<string, string>;
  try {
    ({ batch, driveFileIds } = await downloadAsBatchFiles(drive, listed));
  } catch (e) {
    return {
      folderId: folder.id,
      folderName: folder.name,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
      items: [],
      saved: [],
    };
  }

  const slugPrefix = slugify(folder.name);
  const parsed = await parseBatchFiles(batch, {
    titlePrefix: folder.name,
    slugPrefix,
    sourceFolder: `drive:${folder.id}:${folder.name}`,
    driveFolderId: folder.id,
    driveFileIds,
    saveAudio: async (file) => {
      const driveId = driveFileIds[file.name];
      const saved = driveId
        ? await saveAudioByDriveId(file.buffer, file.name, driveId)
        : await saveAudioUpload(file.buffer, file.name);
      return saved.relativeUrl;
    },
  });

  const items: DriveSyncItemResult[] = [];
  const saved: DriveSyncFolderResult["saved"] = [];
  let hadError = false;

  for (const item of parsed.items) {
    const mapped = await finalizeItem(item, options);
    items.push(mapped);
    if (mapped.status === "error") hadError = true;
    if (
      (mapped.status === "new" || mapped.status === "updated") &&
      mapped.slug &&
      mapped.title &&
      mapped.practiceUrl
    ) {
      saved.push({
        slug: mapped.slug,
        title: mapped.title,
        practiceUrl: mapped.practiceUrl,
        status: mapped.status,
      });
    }
  }

  if (parsed.items.length === 0) {
    return {
      folderId: folder.id,
      folderName: folder.name,
      status: "error",
      error: parsed.issues[0]?.message ?? "Không parse được đề từ folder.",
      items: [],
      saved: [],
    };
  }

  return {
    folderId: folder.id,
    folderName: folder.name,
    status: hadError && saved.length === 0 ? "error" : "ok",
    items,
    saved,
  };
}

async function finalizeItem(
  item: BatchImportItemResult,
  options: { persist: boolean; force: boolean },
): Promise<DriveSyncItemResult> {
  if (!item.draft) {
    return {
      sourceName: item.sourceName,
      status: "error",
      issues: item.issues,
      audioAttached: item.audioAttached,
    };
  }

  const draft = item.draft;
  const existing = await getTestBySlug(draft.slug);
  const status = existing ? "updated" : "new";

  await saveTestDraft(draft);

  if (options.persist) {
    const hasErrors = item.issues.some((i) => i.level === "error");
    if (!hasErrors || options.force) {
      try {
        await persistParsedTest(draft, item.issues, {
          force: options.force,
          status: "DRAFT",
        });
      } catch (e) {
        return {
          sourceName: item.sourceName,
          slug: draft.slug,
          title: draft.title,
          skill: draft.skill,
          practiceUrl: `/tests/${draft.slug}`,
          status,
          issues: [
            ...item.issues,
            {
              level: "warning",
              code: "DRIVE_PERSIST_FAILED",
              message: `Đã lưu local; MySQL thất bại: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          audioAttached: item.audioAttached,
        };
      }
    }
  }

  return {
    sourceName: item.sourceName,
    slug: draft.slug,
    title: draft.title,
    skill: draft.skill,
    practiceUrl: `/tests/${draft.slug}`,
    status,
    issues: item.issues,
    audioAttached: item.audioAttached,
  };
}

export async function syncDriveFolder(input: {
  folderIdOrUrl: string;
  persist?: boolean;
  force?: boolean;
}): Promise<DriveSyncResult> {
  const creds = getDriveCredentialsStatus();
  if (!creds.configured) {
    throw new Error(
      creds.message ??
        "Chưa cấu hình GOOGLE_SERVICE_ACCOUNT_JSON.",
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
  const children = await listDriveChildren(drive, folderId);

  const targets: { id: string; name: string }[] = [];
  const directFiles = children.filter((c) => !c.isFolder);
  const subfolders = children.filter((c) => c.isFolder);

  if (folderHasTestFiles(directFiles)) {
    targets.push(root);
  }

  for (const sub of subfolders) {
    targets.push({ id: sub.id, name: sub.name });
  }

  if (targets.length === 0) {
    return {
      rootFolderId: root.id,
      rootFolderName: root.name,
      folders: [],
      newCount: 0,
      updatedCount: 0,
      errorCount: 1,
      skippedCount: 0,
      issues: [
        {
          level: "error",
          code: "DRIVE_EMPTY",
          message:
            "Folder không có file đề và cũng không có subfolder test nào.",
        },
      ],
    };
  }

  const folders: DriveSyncFolderResult[] = [];
  for (const target of targets) {
    // Skip empty-looking subfolders quickly when root already has files
    if (target.id !== root.id) {
      const listed = await collectTestFiles(drive, target.id);
      if (!folderHasTestFiles(listed)) {
        folders.push({
          folderId: target.id,
          folderName: target.name,
          status: "skipped",
          error: "Bỏ qua — không có Listening/Reading/Writing/keys/audio.",
          items: [],
          saved: [],
        });
        continue;
      }
    }
    folders.push(
      await syncOneTestFolder(drive, target, {
        persist: Boolean(input.persist),
        force: Boolean(input.force),
      }),
    );
  }

  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const issues: ImportIssue[] = [];

  for (const f of folders) {
    if (f.status === "skipped") skippedCount += 1;
    if (f.status === "error") errorCount += 1;
    if (f.error) {
      issues.push({
        level: f.status === "error" ? "error" : "warning",
        code: "DRIVE_FOLDER",
        message: `[${f.folderName}] ${f.error}`,
      });
    }
    for (const item of f.items) {
      if (item.status === "new") newCount += 1;
      else if (item.status === "updated") updatedCount += 1;
      else if (item.status === "error") errorCount += 1;
      for (const issue of item.issues) {
        issues.push({
          ...issue,
          message: `[${f.folderName}/${item.sourceName}] ${issue.message}`,
        });
      }
    }
  }

  return {
    rootFolderId: root.id,
    rootFolderName: root.name,
    folders,
    newCount,
    updatedCount,
    errorCount,
    skippedCount,
    issues,
  };
}
