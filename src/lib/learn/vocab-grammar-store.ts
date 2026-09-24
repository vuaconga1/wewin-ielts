import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/paths";
import { updateVideoProgress } from "@/lib/learn/store";
import { SEED_VOCAB_GRAMMAR } from "@/lib/learn/vocab-grammar-seed";
import type {
  TopicLesson,
  VocabGrammarCatalog,
  VocabGrammarTrack,
} from "@/lib/learn/vocab-grammar-types";

const LEARN_DIR = path.join(DATA_DIR, "learn");
const CATALOG_FILE = path.join(LEARN_DIR, "vocab-grammar.json");
const CACHE_TTL_MS = 5_000;

let catalogCache: { data: VocabGrammarCatalog; expiresAt: number } | null = null;

async function ensureDir() {
  await mkdir(LEARN_DIR, { recursive: true });
}

function sortTopics(topics: TopicLesson[]): TopicLesson[] {
  return [...topics].sort((a, b) => a.order - b.order);
}

/** Prefer seed content when persisted catalog is missing words or out of date. */
function syncTrackFromSeed(
  track: VocabGrammarTrack,
  persisted: TopicLesson[],
): { topics: TopicLesson[]; changed: boolean } {
  const seedList = SEED_VOCAB_GRAMMAR[track];

  // Vocabulary is file-driven seed — replace wholesale when slugs/words/exercises drift.
  if (track === "vocabulary") {
    const bySlug = new Map(persisted.map((t) => [t.slug, t]));
    const drifted =
      persisted.length !== seedList.length ||
      seedList.some((seed) => {
        const existing = bySlug.get(seed.slug);
        if (!existing) return true;
        return (
          (existing.words?.length ?? 0) !== (seed.words?.length ?? 0) ||
          existing.exercises.length !== seed.exercises.length ||
          existing.stub !== seed.stub ||
          existing.title.vi !== seed.title.vi
        );
      });
    if (!drifted) {
      return { topics: sortTopics(persisted), changed: false };
    }
    return { topics: sortTopics(structuredClone(seedList)), changed: true };
  }

  const bySlug = new Map(persisted.map((t) => [t.slug, t]));
  let changed = false;

  const topics = seedList.map((seed) => {
    const existing = bySlug.get(seed.slug);
    if (!existing) {
      changed = true;
      return structuredClone(seed);
    }

    const needsStub = existing.stub !== seed.stub;
    if (needsStub) {
      changed = true;
      return structuredClone(seed);
    }

    return existing;
  });

  if (persisted.length !== seedList.length) changed = true;
  return { topics: sortTopics(topics), changed };
}

function normalizeCatalog(raw: unknown): VocabGrammarCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { grammar?: unknown; vocabulary?: unknown };
  if (!Array.isArray(obj.grammar) || !Array.isArray(obj.vocabulary)) return null;
  return {
    grammar: sortTopics(obj.grammar as TopicLesson[]),
    vocabulary: sortTopics(obj.vocabulary as TopicLesson[]),
  };
}

async function persist(data: VocabGrammarCatalog) {
  try {
    await ensureDir();
    await writeFile(CATALOG_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // read-only FS
  }
}

export async function getVocabGrammarCatalog(): Promise<VocabGrammarCatalog> {
  const now = Date.now();
  if (catalogCache && now < catalogCache.expiresAt) {
    return structuredClone(catalogCache.data);
  }

  let data: VocabGrammarCatalog;
  let shouldPersist = false;
  try {
    await ensureDir();
    const raw = await readFile(CATALOG_FILE, "utf8");
    const parsed = normalizeCatalog(JSON.parse(raw));
    if (parsed && parsed.grammar.length > 0) {
      const grammarSync = syncTrackFromSeed("grammar", parsed.grammar);
      const vocabSync = syncTrackFromSeed("vocabulary", parsed.vocabulary);
      data = {
        grammar: grammarSync.topics,
        vocabulary: vocabSync.topics,
      };
      shouldPersist = grammarSync.changed || vocabSync.changed;
    } else {
      data = structuredClone(SEED_VOCAB_GRAMMAR);
      shouldPersist = true;
    }
  } catch {
    data = structuredClone(SEED_VOCAB_GRAMMAR);
    shouldPersist = true;
  }

  if (shouldPersist) await persist(data);
  catalogCache = { data: structuredClone(data), expiresAt: now + CACHE_TTL_MS };
  return structuredClone(data);
}

export async function getTopicsByTrack(
  track: VocabGrammarTrack,
): Promise<TopicLesson[]> {
  const catalog = await getVocabGrammarCatalog();
  return catalog[track];
}

export async function getTopicBySlug(
  track: VocabGrammarTrack,
  slug: string,
): Promise<TopicLesson | null> {
  const topics = await getTopicsByTrack(track);
  return topics.find((t) => t.slug === slug) ?? null;
}

export async function getTopicById(
  lessonId: string,
): Promise<{ topic: TopicLesson; track: VocabGrammarTrack } | null> {
  const catalog = await getVocabGrammarCatalog();
  for (const track of ["grammar", "vocabulary"] as const) {
    const topic = catalog[track].find((t) => t.id === lessonId);
    if (topic) return { topic, track };
  }
  return null;
}

export { updateVideoProgress };
export { trackProgressStats, isTopicUnlocked } from "@/lib/learn/progress-utils";
