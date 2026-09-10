import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  getDriveCredentialsStatus,
  syncDriveAudio,
  syncDriveFolder,
} from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 300;

async function assertAdminAccess() {
  return requireAdminResponse(getSessionUser);
}

/** Config status for the admin UI (credentials present? default folder?) */
export async function GET() {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;

    const status = getDriveCredentialsStatus();
    return NextResponse.json(status);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Sync one Drive folder (or a parent containing Test * subfolders)
 * into the existing ZIP/batch import pipeline.
 */
export async function POST(request: Request) {
  try {
    const denied = await assertAdminAccess();
    if (denied) return denied;

    const status = getDriveCredentialsStatus();
    if (!status.configured) {
      return NextResponse.json(
        {
          error:
            status.message ??
            "Chưa cấu hình Google Drive (GOOGLE_SERVICE_ACCOUNT_JSON).",
          configured: false,
        },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      folderId?: string;
      folderUrl?: string;
      persist?: boolean;
      force?: boolean;
      /** Only download audio and attach to Listening tests */
      audioOnly?: boolean;
    };

    const folderIdOrUrl =
      (body.folderId ?? body.folderUrl ?? status.defaultFolderId)?.trim() ?? "";

    if (!folderIdOrUrl) {
      return NextResponse.json(
        {
          error:
            "Thiếu folder ID. Dán URL Drive hoặc ID, hoặc đặt GOOGLE_DRIVE_FOLDER_ID trong .env.",
        },
        { status: 400 },
      );
    }

    if (body.audioOnly) {
      const audio = await syncDriveAudio({
        folderIdOrUrl,
        persist: Boolean(body.persist),
        force: Boolean(body.force),
      });
      return NextResponse.json({
        ok: audio.failed === 0 && (audio.downloaded + audio.skippedExisting > 0 || audio.found === 0),
        mode: "audioOnly",
        ...audio,
      });
    }

    const result = await syncDriveFolder({
      folderIdOrUrl,
      persist: Boolean(body.persist),
      force: Boolean(body.force),
    });

    return NextResponse.json({
      ok: result.errorCount === 0 || result.newCount + result.updatedCount > 0,
      ...result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const missingCreds =
      /GOOGLE_SERVICE_ACCOUNT|credentials|Thiếu credentials/i.test(message);
    return NextResponse.json(
      { error: message, configured: !missingCreds },
      { status: missingCreds ? 503 : 500 },
    );
  }
}
