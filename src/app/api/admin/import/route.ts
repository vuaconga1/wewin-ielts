import { NextResponse } from "next/server";
import { parseTestFromUpload } from "@/lib/import/pipeline";
import { persistParsedTest } from "@/lib/import/persist";
import { saveTestDraft } from "@/lib/store/test-store";
import { saveAudioUpload } from "@/lib/import/audio";
import {
  expandZipBuffer,
  parseBatchFiles,
  type BatchFile,
} from "@/lib/import/batch";
import type { Skill } from "@/lib/import/detect-skill";
import type { ParsedTestDraft } from "@/lib/import/schemas";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import path from "node:path";

export const runtime = "nodejs";

const SKILLS = ["LISTENING", "READING", "WRITING", "SPEAKING"] as const;

async function assertAdminAccess() {
  return requireAdminResponse(getSessionUser);
}

async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}

export async function POST(request: Request) {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;

    const form = await request.formData();
    const action = String(form.get("action") ?? "preview");
    const force = form.get("force") === "true";
    const title = String(form.get("title") ?? "").trim() || undefined;
    const slug = String(form.get("slug") ?? "").trim() || undefined;
    const skillRaw = form.get("skill");
    const skill =
      skillRaw && SKILLS.includes(skillRaw as (typeof SKILLS)[number])
        ? (skillRaw as Skill)
        : undefined;

    const zipFile = form.get("zipFile");
    const batchFiles = form
      .getAll("batchFiles")
      .filter((f) => f instanceof File) as File[];
    const contentFile = form.get("contentFile");
    const keysFile = form.get("keysFile");
    const audioFile = form.get("audioFile");

    if (
      (zipFile instanceof File && zipFile.size > 0) ||
      batchFiles.some((f) => f.size > 0)
    ) {
      return handleBatch({
        zipFile: zipFile instanceof File && zipFile.size > 0 ? zipFile : null,
        batchFiles: batchFiles.filter((f) => f.size > 0),
        action,
        force,
        title,
        slug,
      });
    }

    if (!(contentFile instanceof File) || contentFile.size === 0) {
      return NextResponse.json(
        {
          error:
            "Chọn file đề (.docx / .md / .txt), hoặc ZIP / nhiều file (batch).",
        },
        { status: 400 },
      );
    }

    const contentBuffer = await fileToBuffer(contentFile);
    const keysBuffer =
      keysFile instanceof File && keysFile.size > 0
        ? await fileToBuffer(keysFile)
        : undefined;

    let audioFiles: string[] | undefined;
    if (audioFile instanceof File && audioFile.size > 0) {
      const saved = await saveAudioUpload(
        await fileToBuffer(audioFile),
        audioFile.name,
      );
      audioFiles = [saved.relativeUrl];
    }

    const { draft, issues } = await parseTestFromUpload({
      contentBuffer,
      contentFilename: contentFile.name,
      keysBuffer,
      keysFilename: keysFile instanceof File ? keysFile.name : undefined,
      skill,
      title,
      slug,
      audioFiles,
    });

    if (!draft) {
      return NextResponse.json({ draft: null, issues }, { status: 422 });
    }

    return finalizeSingle(draft, issues, action, force);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleBatch(input: {
  zipFile: File | null;
  batchFiles: File[];
  action: string;
  force: boolean;
  title?: string;
  slug?: string;
}) {
  const files: BatchFile[] = [];

  if (input.zipFile) {
    const buf = await fileToBuffer(input.zipFile);
    const ext = path.extname(input.zipFile.name).toLowerCase();
    if (ext === ".zip") {
      files.push(...(await expandZipBuffer(buf)));
    } else {
      files.push({ name: input.zipFile.name, buffer: buf });
    }
  }

  for (const f of input.batchFiles) {
    files.push({ name: f.name, buffer: await fileToBuffer(f) });
  }

  const batch = await parseBatchFiles(files, {
    titlePrefix: input.title,
    slugPrefix: input.slug,
    saveAudio: async (file) => {
      const saved = await saveAudioUpload(file.buffer, file.name);
      return saved.relativeUrl;
    },
  });

  const saved: { slug: string; practiceUrl: string; title: string }[] = [];
  const drafts: ParsedTestDraft[] = [];

  for (const item of batch.items) {
    if (!item.draft) continue;
    drafts.push(item.draft);
    if (
      input.action === "preview" ||
      input.action === "publish" ||
      input.action === "persist"
    ) {
      await saveTestDraft(item.draft);
      saved.push({
        slug: item.draft.slug,
        practiceUrl: `/tests/${item.draft.slug}`,
        title: item.draft.title,
      });
    }
  }

  if (input.action === "persist") {
    const persistResults = [];
    for (const draft of drafts) {
      const itemIssues =
        batch.items.find((i) => i.draft?.slug === draft.slug)?.issues ?? [];
      const hasErrors = itemIssues.some((i) => i.level === "error");
      if (hasErrors && !input.force) continue;
      try {
        const result = await persistParsedTest(draft, itemIssues, {
          force: input.force,
          status: "DRAFT",
        });
        persistResults.push(result);
      } catch (e) {
        persistResults.push({
          testId: null,
          importJobId: "",
          usedDatabase: false,
          issues: [
            {
              level: "error" as const,
              code: "PERSIST_FAILED",
              message: e instanceof Error ? e.message : String(e),
            },
          ],
        });
      }
    }
    return NextResponse.json({
      batch: true,
      items: batch.items.map((i) => ({
        sourceName: i.sourceName,
        draft: i.draft,
        issues: i.issues,
        audioAttached: i.audioAttached,
      })),
      issues: batch.issues,
      saved,
      persist: persistResults,
      savedLocal: saved.length > 0,
    });
  }

  if (drafts.length === 0) {
    return NextResponse.json(
      {
        batch: true,
        items: batch.items,
        issues: batch.issues,
        error: "Batch không tạo được draft nào.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    batch: true,
    items: batch.items.map((i) => ({
      sourceName: i.sourceName,
      draft: i.draft,
      issues: i.issues,
      audioAttached: i.audioAttached,
    })),
    issues: batch.issues,
    saved,
    draft: drafts[0],
    practiceUrl: saved[0]?.practiceUrl,
    savedLocal: true,
  });
}

async function finalizeSingle(
  draft: ParsedTestDraft,
  issues: import("@/lib/import/schemas").ImportIssue[],
  action: string,
  force: boolean,
) {
  if (action === "preview" || action === "publish" || action === "persist") {
    await saveTestDraft(draft);
  }

  if (action === "preview" || action === "publish") {
    return NextResponse.json({
      draft,
      issues,
      practiceUrl: `/tests/${draft.slug}`,
      savedLocal: true,
    });
  }

  if (action === "persist") {
    const hasErrors = issues.some((i) => i.level === "error");
    if (hasErrors && !force) {
      return NextResponse.json(
        {
          error: "Có lỗi — sửa keys hoặc bật 'Lưu dù có lỗi'.",
          draft,
          issues,
          practiceUrl: `/tests/${draft.slug}`,
          savedLocal: true,
        },
        { status: 422 },
      );
    }

    try {
      const result = await persistParsedTest(draft, issues, {
        force,
        status: "DRAFT",
      });
      return NextResponse.json({
        draft,
        issues,
        persist: result,
        practiceUrl: `/tests/${draft.slug}`,
        savedLocal: true,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: `MySQL thất bại (đã lưu local để luyện tập): ${message}`,
          draft,
          issues,
          practiceUrl: `/tests/${draft.slug}`,
          savedLocal: true,
        },
        { status: 200 },
      );
    }
  }

  return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 });
}
