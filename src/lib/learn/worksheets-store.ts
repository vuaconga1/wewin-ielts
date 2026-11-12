import { readFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/paths";
import type {
  WorksheetLesson,
  WorksheetCatalogItem,
  WorksheetCardCatalogItem,
} from "./worksheet-types";

const WORKSHEET_DIR = path.join(DATA_DIR, "learn", "worksheets");
const CATALOG_PATH = path.join(DATA_DIR, "learn", "worksheets-catalog.json");
const CARDS_DIR = path.join(DATA_DIR, "learn", "worksheet-cards");
const CARDS_CATALOG_PATH = path.join(DATA_DIR, "learn", "worksheet-cards-catalog.json");

let catalogCache: { data: WorksheetCatalogItem[]; timestamp: number } | null = null;
let cardsCatalogCache: { data: WorksheetCardCatalogItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10_000;

/**
 * Retrieve the list of all available thematic cards with metadata.
 */
export async function getWorksheetCardsCatalog(): Promise<WorksheetCardCatalogItem[]> {
  const now = Date.now();
  if (cardsCatalogCache && now - cardsCatalogCache.timestamp < CACHE_TTL_MS) {
    return cardsCatalogCache.data;
  }

  try {
    const raw = await readFile(CARDS_CATALOG_PATH, "utf8");
    const parsed = JSON.parse(raw) as { cards: WorksheetCardCatalogItem[] };
    const items = (parsed.cards || []).sort((a, b) => a.order - b.order);
    cardsCatalogCache = { data: items, timestamp: now };
    return items;
  } catch {
    return [];
  }
}

/**
 * Load a thematic card lesson by its ID (e.g. "card-01").
 */
export async function getWorksheetCardById(id: string): Promise<WorksheetLesson | null> {
  try {
    const filePath = path.join(CARDS_DIR, `${id}.json`);
    const raw = await readFile(filePath, "utf8");
    const lesson = JSON.parse(raw) as WorksheetLesson;
    return lesson;
  } catch {
    return null;
  }
}

/**
 * Find a thematic card by its URL slug.
 */
export async function getWorksheetCardBySlug(slug: string): Promise<WorksheetLesson | null> {
  const catalog = await getWorksheetCardsCatalog();
  const meta = catalog.find((c) => c.slug === slug || c.id === slug);
  if (!meta) return null;
  return getWorksheetCardById(meta.id);
}

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
 * Find a specific worksheet or card by its URL slug.
 */
export async function getWorksheetBySlug(slug: string): Promise<WorksheetLesson | null> {
  // First, check if slug belongs to a thematic card
  const cardLesson = await getWorksheetCardBySlug(slug);
  if (cardLesson) return cardLesson;

  // Otherwise, fallback to individual worksheet
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


