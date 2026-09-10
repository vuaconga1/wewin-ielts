/**
 * Extract a Google Drive folder ID from a pasted URL or raw ID.
 *
 * Supported:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID?...
 * - https://drive.google.com/open?id=FOLDER_ID
 * - raw FOLDER_ID
 */

const FOLDER_PATH =
  /drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?folders\/|open\?id=|file\/d\/)([a-zA-Z0-9_-]+)/i;
const ID_QUERY = /[?&]id=([a-zA-Z0-9_-]+)/i;
const RAW_ID = /^[a-zA-Z0-9_-]{10,}$/;

export function parseDriveFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromPath = FOLDER_PATH.exec(trimmed);
  if (fromPath?.[1]) return fromPath[1];

  const fromQuery = ID_QUERY.exec(trimmed);
  if (fromQuery?.[1]) return fromQuery[1];

  if (RAW_ID.test(trimmed)) return trimmed;

  return null;
}
