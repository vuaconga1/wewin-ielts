/**
 * Batch import: ZIP or multi-file upload (Listening/Reading/Writing + keys + audio).
 */

import JSZip from "jszip";
import path from "node:path";
import {
  detectSkillFromFilename,
  slugify,
  type Skill,
} from "./detect-skill";
import { parseTestFromUpload } from "./pipeline";
import type { ImportIssue, ImportParseResult, ParsedTestDraft } from "./schemas";

export type BatchFile = {
  name: string;
  buffer: Buffer;
};

export type BatchImportItemResult = ImportParseResult & {
  sourceName: string;
  audioAttached?: string[];
};

export type BatchImportResult = {
  items: BatchImportItemResult[];
  issues: ImportIssue[];
};

const CONTENT_EXT = new Set([".docx", ".md", ".txt"]);
const KEYS_NAME = /keys?|đáp\s*án|dap\s*an|answer/i;
const AUDIO_EXT = new Set([".mp3", ".m4a", ".wav", ".ogg"]);
const SKILL_IN_NAME =
  /(listening|reading|writing|speaking)/i;

/**
 * Expand a ZIP into flat file list (skips __MACOSX / directories).
 */
export async function expandZipBuffer(buffer: Buffer): Promise<BatchFile[]> {
  const zip = await JSZip.loadAsync(buffer);
  const files: BatchFile[] = [];

  const entries = Object.keys(zip.files).sort();
  for (const name of entries) {
    const entry = zip.files[name]!;
    if (entry.dir) continue;
    if (name.includes("__MACOSX") || name.startsWith(".")) continue;
    const base = path.basename(name);
    if (base.startsWith(".")) continue;
    const data = await entry.async("nodebuffer");
    files.push({ name: base, buffer: Buffer.from(data) });
  }

  return files;
}

function isKeysFile(name: string): boolean {
  return KEYS_NAME.test(path.basename(name));
}

function isAudioFile(name: string): boolean {
  return AUDIO_EXT.has(path.extname(name).toLowerCase());
}

function isContentFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  if (!CONTENT_EXT.has(ext)) return false;
  if (isKeysFile(name)) return false;
  return true;
}

function pickKeysForSkill(
  keysFiles: BatchFile[],
  skill: Skill,
  contentName: string,
): BatchFile | undefined {
  const skillLower = skill.toLowerCase();
  const bySkill = keysFiles.find((f) =>
    new RegExp(skillLower, "i").test(f.name),
  );
  if (bySkill) return bySkill;

  // Pair by number: "Listening 5.docx" ↔ "Listening-keys 5" / "keys 5"
  const num = contentName.match(/(\d+)/)?.[1];
  if (num) {
    const byNum = keysFiles.find(
      (f) => f.name.includes(num) && !SKILL_IN_NAME.test(f.name.replace(KEYS_NAME, "")),
    );
    if (byNum) return byNum;
    const skillNum = keysFiles.find(
      (f) => f.name.includes(num) && new RegExp(skillLower, "i").test(f.name),
    );
    if (skillNum) return skillNum;
  }

  // Single shared keys file
  if (keysFiles.length === 1) return keysFiles[0];
  return keysFiles.find((f) => !SKILL_IN_NAME.test(f.name)) ?? keysFiles[0];
}

function pickAudioForListening(
  audioFiles: BatchFile[],
  contentName: string,
): BatchFile[] {
  if (audioFiles.length === 0) return [];
  const num = contentName.match(/(\d+)/)?.[1];
  if (num) {
    const matched = audioFiles.filter((f) => f.name.includes(num));
    if (matched.length) return matched;
  }
  return audioFiles;
}

/**
 * Group multi-file / ZIP contents into per-skill parse jobs.
 */
export async function parseBatchFiles(
  files: BatchFile[],
  options: {
    titlePrefix?: string;
    slugPrefix?: string;
    sourceFolder?: string;
    driveFolderId?: string;
    driveFileIds?: Record<string, string>;
    /** Called for each listening audio file; returns public URL path */
    saveAudio?: (file: BatchFile) => Promise<string>;
  } = {},
): Promise<BatchImportResult> {
  const issues: ImportIssue[] = [];
  const contentFiles = files.filter((f) => isContentFile(f.name));
  const keysFiles = files.filter(
    (f) => CONTENT_EXT.has(path.extname(f.name).toLowerCase()) && isKeysFile(f.name),
  );
  const audioFiles = files.filter((f) => isAudioFile(f.name));

  if (contentFiles.length === 0) {
    return {
      items: [],
      issues: [
        {
          level: "error",
          code: "BATCH_NO_CONTENT",
          message:
            "ZIP/batch không có file đề (.docx/.md). Cần Listening/Reading/Writing…",
        },
      ],
    };
  }

  const items: BatchImportItemResult[] = [];

  for (const content of contentFiles) {
    const skill = detectSkillFromFilename(content.name);
    if (!skill) {
      issues.push({
        level: "warning",
        code: "BATCH_SKIP_UNKNOWN",
        message: `Bỏ qua ${content.name} — không nhận diện skill.`,
      });
      continue;
    }

    const keys = pickKeysForSkill(keysFiles, skill, content.name);
    let audioPaths: string[] | undefined;

    if (skill === "LISTENING" && options.saveAudio) {
      const audios = pickAudioForListening(audioFiles, content.name);
      audioPaths = [];
      for (const a of audios) {
        const url = await options.saveAudio(a);
        audioPaths.push(url);
      }
    }

    const title = options.titlePrefix
      ? `${options.titlePrefix} - ${skill.charAt(0)}${skill.slice(1).toLowerCase()}`
      : undefined;
    const slugBase = options.slugPrefix
      ? `${options.slugPrefix}-${skill.toLowerCase()}`
      : undefined;

    const result = await parseTestFromUpload({
      contentBuffer: content.buffer,
      contentFilename: content.name,
      keysBuffer: keys?.buffer,
      keysFilename: keys?.name,
      skill,
      title,
      slug: slugBase ? slugify(slugBase) : undefined,
      sourceFolder: options.sourceFolder,
      driveFolderId: options.driveFolderId,
      driveFileIds: options.driveFileIds,
      audioFiles: audioPaths,
    });

    items.push({
      ...result,
      sourceName: content.name,
      audioAttached: audioPaths,
    });

    for (const issue of result.issues) {
      issues.push({
        ...issue,
        message: `[${content.name}] ${issue.message}`,
      });
    }
  }

  if (audioFiles.length && !contentFiles.some((f) => /listening/i.test(f.name))) {
    issues.push({
      level: "warning",
      code: "BATCH_AUDIO_UNUSED",
      message: "Có file audio nhưng không có Listening để gắn.",
    });
  }

  return { items, issues };
}

export function draftsFromBatch(result: BatchImportResult): ParsedTestDraft[] {
  return result.items
    .map((i) => i.draft)
    .filter((d): d is ParsedTestDraft => d != null);
}
