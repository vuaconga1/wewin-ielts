/**
 * Google Drive client (service account, read-only).
 * Share the Drive folder with the service account email (Viewer).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { google, type drive_v3 } from "googleapis";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const GOOGLE_DOC = "application/vnd.google-apps.document";
const GOOGLE_SHEET = "application/vnd.google-apps.spreadsheet";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type DriveListedFile = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
};

export type DriveCredentialsStatus = {
  configured: boolean;
  defaultFolderId: string;
  message?: string;
};

type ServiceAccountCreds = {
  client_email: string;
  private_key: string;
};

function asCreds(obj: unknown): ServiceAccountCreds {
  if (!obj || typeof obj !== "object") {
    throw new Error("Service account JSON không hợp lệ.");
  }
  const rec = obj as Record<string, unknown>;
  if (
    typeof rec.client_email !== "string" ||
    typeof rec.private_key !== "string"
  ) {
    throw new Error(
      "Service account JSON thiếu client_email / private_key.",
    );
  }
  return {
    client_email: rec.client_email,
    private_key: rec.private_key.replace(/\\n/g, "\n"),
  };
}

export function getDriveCredentialsStatus(): DriveCredentialsStatus {
  const hasJson = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
  return {
    configured: hasJson,
    defaultFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? "",
    message: hasJson
      ? undefined
      : "Chưa cấu hình Google Drive. Đặt GOOGLE_SERVICE_ACCOUNT_JSON (đường dẫn hoặc JSON) trong .env và chia sẻ folder với email service account.",
  };
}

async function loadServiceAccount(): Promise<ServiceAccountCreds> {
  const inlineOrPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const appCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (inlineOrPath) {
    if (inlineOrPath.startsWith("{")) {
      return asCreds(JSON.parse(inlineOrPath));
    }
    const abs = path.isAbsolute(inlineOrPath)
      ? inlineOrPath
      : path.join(process.cwd(), inlineOrPath);
    const raw = await readFile(abs, "utf8");
    return asCreds(JSON.parse(raw));
  }

  if (appCreds) {
    const abs = path.isAbsolute(appCreds)
      ? appCreds
      : path.join(process.cwd(), appCreds);
    const raw = await readFile(abs, "utf8");
    return asCreds(JSON.parse(raw));
  }

  throw new Error(
    "Thiếu credentials Google Drive. Đặt GOOGLE_SERVICE_ACCOUNT_JSON trong .env (path tới JSON service account hoặc nội dung JSON).",
  );
}

export async function getDriveClient(): Promise<drive_v3.Drive> {
  const creds = await loadServiceAccount();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [DRIVE_SCOPE],
  });
  return google.drive({ version: "v3", auth });
}

export async function listDriveChildren(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<DriveListedFile[]> {
  const out: DriveListedFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
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
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDriveFolderMeta(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<{ id: string; name: string }> {
  const res = await drive.files.get({
    fileId: folderId,
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  });
  if (!res.data.id) {
    throw new Error(`Không tìm thấy folder Drive: ${folderId}`);
  }
  if (res.data.mimeType !== FOLDER_MIME) {
    throw new Error(
      `ID không phải folder Drive (mime=${res.data.mimeType}). Dán URL dạng /drive/folders/FOLDER_ID.`,
    );
  }
  return { id: res.data.id, name: res.data.name ?? folderId };
}

/**
 * Download a binary file, or export Google Docs/Sheets to importable formats.
 */
export async function downloadDriveFile(
  drive: drive_v3.Drive,
  file: Pick<DriveListedFile, "id" | "name" | "mimeType">,
): Promise<{ name: string; buffer: Buffer }> {
  if (file.mimeType === GOOGLE_DOC) {
    const res = await drive.files.export(
      { fileId: file.id, mimeType: DOCX_MIME },
      { responseType: "arraybuffer" },
    );
    const name = /\.docx$/i.test(file.name) ? file.name : `${file.name}.docx`;
    return { name, buffer: Buffer.from(res.data as ArrayBuffer) };
  }

  if (file.mimeType === GOOGLE_SHEET) {
    const res = await drive.files.export(
      { fileId: file.id, mimeType: "text/csv" },
      { responseType: "arraybuffer" },
    );
    const name = /\.(csv|txt|md)$/i.test(file.name)
      ? file.name
      : `${file.name}.csv`;
    return { name, buffer: Buffer.from(res.data as ArrayBuffer) };
  }

  const res = await drive.files.get(
    { fileId: file.id, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );
  return {
    name: file.name,
    buffer: Buffer.from(res.data as ArrayBuffer),
  };
}
