import { readFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/paths";
import type {
  WorksheetLesson,
  WorksheetCatalogItem,
} from "./worksheet-types";

const WORKSHEET_DIR = path.join(DATA_DIR, "learn", "worksheets");
const CATALOG_PATH = path.join(DATA_DIR, "learn", "worksheets-catalog.json");

let catalogCache: { data: WorksheetCatalogItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10_000;

/**
 * Retrieve the list of all available worksheets with metadata.
 */
export async function getWorksheetsCatalog(): Promise<WorksheetCatalogItem[]> {
  const now = Date.now();
  if (catalogCache && now - catalogCache.timestamp < CACHE_TTL_MS) {
    return catalogCache.data;
  }

  try {
    const raw = await readFile(CATALOG_PATH, "utf8");
    const parsed = JSON.parse(raw) as { worksheets: WorksheetCatalogItem[] };
    const items = (parsed.worksheets || []).sort((a, b) => a.order - b.order);
    catalogCache = { data: items, timestamp: now };
    return items;
  } catch {
    return [];
  }
}

/**
 * Find a specific worksheet by its URL slug.
 */
export async function getWorksheetBySlug(slug: string): Promise<WorksheetLesson | null> {
  const catalog = await getWorksheetsCatalog();
  const meta = catalog.find((c) => c.slug === slug || c.id === slug);
  if (!meta) return null;

  return getWorksheetById(meta.id);
}

/**
 * Load a worksheet by its ID (e.g. "ws-01").
 */
export async function getWorksheetById(id: string): Promise<WorksheetLesson | null> {
  try {
    const filePath = path.join(WORKSHEET_DIR, `${id}.json`);
    const raw = await readFile(filePath, "utf8");
    const lesson = JSON.parse(raw) as WorksheetLesson;
    return lesson;
  } catch {
    return null;
  }
}

