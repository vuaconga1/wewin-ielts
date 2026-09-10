import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { SEED_CATALOG, SEED_COURSE } from "@/lib/learn/seed-content";
import { DATA_DIR } from "@/lib/paths";
import type {
  LearnCatalog,
  LearnCourse,
  LearnExercise,
  LearnExerciseType,
  LearnLesson,
  LearnProgressStore,
  LearnSkill,
  LessonProgress,
} from "@/lib/learn/types";
import { LEARN_SKILLS, isLearnSkill } from "@/lib/learn/types";
import {
  isLessonUnlocked,
  skillProgressStats,
} from "@/lib/learn/progress-utils";

export { isLessonUnlocked, skillProgressStats };

const LEARN_DIR = path.join(DATA_DIR, "learn");
const CURRICULUM_FILE = path.join(LEARN_DIR, "curriculum.json");
const PROGRESS_DIR = path.join(LEARN_DIR, "progress");

/** Short in-memory TTL to avoid fs thrashing on learn list/hub pages. */
const CATALOG_CACHE_TTL_MS = 5_000;

const PASS_THRESHOLD = 1; // all correct required (fraction 0–1)
const EXERCISE_TYPES = new Set<LearnExerciseType>([
  "multiple_choice",
  "short_answer",
  "gap_fill",
]);

const RESERVED_COURSE_IDS = new Set<string>([
  ...LEARN_SKILLS,
  "courses",
  "new",
  "progress",
  "admin",
]);

let catalogCache: { data: LearnCatalog; expiresAt: number } | null = null;

async function ensureLearnDirs() {
  await mkdir(LEARN_DIR, { recursive: true });
  await mkdir(PROGRESS_DIR, { recursive: true });
}

function sortCourseLessons(lessons: LearnLesson[]): LearnLesson[] {
  return [...lessons].sort((a, b) => {
    if (a.skill !== b.skill) {
      return LEARN_SKILLS.indexOf(a.skill) - LEARN_SKILLS.indexOf(b.skill);
    }
    return a.order - b.order;
  });
}

export function slugifyCourseId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function isReservedCourseId(id: string): boolean {
  return RESERVED_COURSE_IDS.has(id);
}

function normalizeCourse(
  raw: Partial<LearnCourse> & { courseId?: string },
): LearnCourse {
  const id =
    slugifyCourseId(String(raw.id ?? raw.courseId ?? "")) || SEED_COURSE.id;
  const levelRaw = String(raw.level ?? "").trim();
  return {
    id: isReservedCourseId(id) ? `${id}-course` : id,
    title: String(raw.title ?? "").trim() || SEED_COURSE.title,
    description:
      raw.description == null
        ? SEED_COURSE.description
        : String(raw.description).trim(),
    ...(levelRaw ? { level: levelRaw } : {}),
    lessons: sortCourseLessons(Array.isArray(raw.lessons) ? raw.lessons : []),
  };
}

function parseCatalog(raw: unknown): LearnCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as {
    courses?: unknown;
    lessons?: unknown;
    courseId?: string;
    id?: string;
    title?: string;
    description?: string;
    level?: string;
  };

  if (Array.isArray(obj.courses)) {
    const courses = obj.courses
      .filter((c) => c && typeof c === "object")
      .map((c) => normalizeCourse(c as Partial<LearnCourse>));
    if (courses.length === 0) return null;
    const seen = new Set<string>();
    const unique: LearnCourse[] = [];
    for (const course of courses) {
      let id = course.id;
      if (seen.has(id)) id = `${id}-${unique.length + 1}`;
      seen.add(id);
      unique.push({ ...course, id });
    }
    return { courses: unique };
  }

  if (Array.isArray(obj.lessons) && obj.lessons.length > 0) {
    return {
      courses: [
        normalizeCourse({
          id: obj.id,
          courseId: obj.courseId,
          title: obj.title,
          description: obj.description,
          level: obj.level || "A",
          lessons: obj.lessons as LearnLesson[],
        }),
      ],
    };
  }

  return null;
}

async function persistCatalog(data: LearnCatalog): Promise<void> {
  try {
    await ensureLearnDirs();
    await writeFile(CURRICULUM_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // read-only FS (e.g. some serverless) — serve in memory
  }
}

export async function getCatalog(): Promise<LearnCatalog> {
  const now = Date.now();
  if (catalogCache && now < catalogCache.expiresAt) {
    return structuredClone(catalogCache.data);
  }

  let data: LearnCatalog;
  let shouldPersist = false;
  try {
    await ensureLearnDirs();
    const raw = await readFile(CURRICULUM_FILE, "utf8");
    const parsedJson = JSON.parse(raw) as { courses?: unknown };
    const parsed = parseCatalog(parsedJson);
    if (parsed) {
      data = parsed;
      shouldPersist = !Array.isArray(parsedJson.courses);
    } else {
      data = structuredClone(SEED_CATALOG);
      shouldPersist = true;
    }
  } catch {
    data = structuredClone(SEED_CATALOG);
    shouldPersist = true;
  }

  if (shouldPersist) await persistCatalog(data);

  catalogCache = {
    data: structuredClone(data),
    expiresAt: now + CATALOG_CACHE_TTL_MS,
  };
  return structuredClone(data);
}

export async function saveCatalog(
  catalog: LearnCatalog,
): Promise<LearnCatalog> {
  const normalized: LearnCatalog = {
    courses: (catalog.courses.length
      ? catalog.courses
      : structuredClone(SEED_CATALOG.courses)
    ).map((c) => normalizeCourse(c)),
  };
  await persistCatalog(normalized);
  catalogCache = {
    data: structuredClone(normalized),
    expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
  };
  return structuredClone(normalized);
}

export async function getCourse(
  courseId: string,
): Promise<LearnCourse | null> {
  const catalog = await getCatalog();
  return catalog.courses.find((c) => c.id === courseId) ?? null;
}

export async function getDefaultCourseId(): Promise<string> {
  const catalog = await getCatalog();
  return catalog.courses[0]?.id ?? SEED_COURSE.id;
}

/** First course — used by admin list fallbacks. */
export async function getCurriculum(): Promise<LearnCourse> {
  const catalog = await getCatalog();
  return structuredClone(catalog.courses[0] ?? SEED_COURSE);
}

export async function saveCurriculum(
  curriculum: LearnCourse,
): Promise<LearnCourse> {
  const catalog = await getCatalog();
  const course = normalizeCourse(curriculum);
  const idx = catalog.courses.findIndex((c) => c.id === course.id);
  if (idx >= 0) catalog.courses[idx] = course;
  else catalog.courses.push(course);
  await saveCatalog(catalog);
  return course;
}

export async function resetCurriculumToSeed(): Promise<LearnCatalog> {
  return saveCatalog(structuredClone(SEED_CATALOG));
}

export type CourseInput = {
  id?: string;
  title: string;
  description?: string;
  level?: string;
};

export async function createCourse(input: CourseInput): Promise<LearnCourse> {
  const catalog = await getCatalog();
  const title = String(input.title ?? "").trim();
  if (!title) {
    throw new LearnStoreError("INVALID_COURSE", "Thiếu tên khóa học");
  }
  const id = slugifyCourseId(input.id || title);
  if (!id) {
    throw new LearnStoreError("INVALID_COURSE", "Mã khóa học không hợp lệ");
  }
  if (isReservedCourseId(id)) {
    throw new LearnStoreError(
      "RESERVED_COURSE",
      "Mã khóa học trùng tên kỹ năng — hãy chọn mã khác",
    );
  }
  if (catalog.courses.some((c) => c.id === id)) {
    throw new LearnStoreError("DUPLICATE_COURSE", `Khóa học đã tồn tại: ${id}`);
  }
  const course: LearnCourse = {
    id,
    title,
    description: String(input.description ?? "").trim(),
    ...(String(input.level ?? "").trim()
      ? { level: String(input.level).trim() }
      : {}),
    lessons: [],
  };
  catalog.courses.push(course);
  await saveCatalog(catalog);
  return course;
}

function skillPrefix(skill: LearnSkill): string {
  return skill.slice(0, 3);
}

export function generateLessonId(
  skill: LearnSkill,
  existingIds: Set<string>,
): string {
  const prefix = skillPrefix(skill);
  for (let n = 1; n < 1000; n++) {
    const id = `${prefix}-${String(n).padStart(2, "0")}`;
    if (!existingIds.has(id)) return id;
  }
  return `${prefix}-${randomBytes(3).toString("hex")}`;
}

export function generateExerciseId(lessonId: string, index: number): string {
  return `${lessonId}-q${index + 1}`;
}

export type LessonInput = {
  id?: string;
  courseId?: string;
  skill: LearnSkill;
  title: string;
  order: number;
  summary?: string;
  videoUrl: string;
  durationSec?: number;
  exercises: LearnExercise[];
};

export function normalizeExercise(
  raw: Partial<LearnExercise> & { prompt?: string },
  fallbackId: string,
): LearnExercise {
  const type = (
    EXERCISE_TYPES.has(raw.type as LearnExerciseType)
      ? raw.type
      : "short_answer"
  ) as LearnExerciseType;
  const prompt = String(raw.prompt ?? "").trim();
  const answers = (Array.isArray(raw.answers) ? raw.answers : [])
    .map((a) => String(a).trim())
    .filter(Boolean);
  const options =
    type === "multiple_choice" && Array.isArray(raw.options)
      ? raw.options.map((o) => String(o).trim()).filter(Boolean)
      : undefined;

  if (!prompt) {
    throw new LearnStoreError("INVALID_EXERCISE", "Câu hỏi thiếu nội dung");
  }
  if (answers.length === 0) {
    throw new LearnStoreError(
      "INVALID_EXERCISE",
      `Câu hỏi "${prompt.slice(0, 40)}" cần ít nhất một đáp án đúng`,
    );
  }
  if (type === "multiple_choice" && (!options || options.length < 2)) {
    throw new LearnStoreError(
      "INVALID_EXERCISE",
      `MCQ "${prompt.slice(0, 40)}" cần ít nhất 2 lựa chọn`,
    );
  }

  return {
    id: String(raw.id ?? fallbackId).trim() || fallbackId,
    type,
    prompt,
    ...(options ? { options } : {}),
    answers,
  };
}

export function normalizeLessonInput(
  input: LessonInput,
  existingIds: Set<string>,
): LearnLesson {
  if (!isLearnSkill(input.skill)) {
    throw new LearnStoreError("INVALID_SKILL", "Kỹ năng không hợp lệ");
  }
  const title = String(input.title ?? "").trim();
  if (!title) {
    throw new LearnStoreError("INVALID_LESSON", "Thiếu tiêu đề bài học");
  }
  const videoUrl = String(input.videoUrl ?? "").trim();
  if (!videoUrl) {
    throw new LearnStoreError(
      "INVALID_LESSON",
      "Cần URL video hoặc tải file video lên",
    );
  }
  const order = Number(input.order);
  if (!Number.isFinite(order) || order < 1) {
    throw new LearnStoreError(
      "INVALID_LESSON",
      "Thứ tự (order) phải là số ≥ 1",
    );
  }

  const id =
    String(input.id ?? "").trim() ||
    generateLessonId(input.skill, existingIds);

  const exercises = (input.exercises ?? []).map((ex, i) =>
    normalizeExercise(ex, generateExerciseId(id, i)),
  );
  if (exercises.length === 0) {
    throw new LearnStoreError(
      "INVALID_LESSON",
      "Cần ít nhất một câu bài tập",
    );
  }

  return {
    id,
    skill: input.skill,
    title,
    order: Math.floor(order),
    summary: String(input.summary ?? "").trim(),
    videoUrl,
    ...(typeof input.durationSec === "number" &&
    Number.isFinite(input.durationSec) &&
    input.durationSec > 0
      ? { durationSec: Math.round(input.durationSec) }
      : {}),
    exercises,
  };
}

function allLessonIds(catalog: LearnCatalog): Set<string> {
  return new Set(catalog.courses.flatMap((c) => c.lessons.map((l) => l.id)));
}

export type LessonContext = {
  course: LearnCourse;
  lesson: LearnLesson;
};

export async function getLessonContext(
  lessonId: string,
): Promise<LessonContext | null> {
  const catalog = await getCatalog();
  for (const course of catalog.courses) {
    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson) return { course, lesson };
  }
  return null;
}

function requireCourse(catalog: LearnCatalog, courseId?: string): LearnCourse {
  const id = courseId?.trim();
  const course = id
    ? catalog.courses.find((c) => c.id === id)
    : catalog.courses[0];
  if (!course) {
    throw new LearnStoreError("COURSE_NOT_FOUND", "Không tìm thấy khóa học");
  }
  return course;
}

export async function createLesson(input: LessonInput): Promise<LearnLesson> {
  const catalog = await getCatalog();
  const course = requireCourse(catalog, input.courseId);
  const existingIds = allLessonIds(catalog);
  const lesson = normalizeLessonInput(input, existingIds);
  if (existingIds.has(lesson.id)) {
    throw new LearnStoreError(
      "DUPLICATE_ID",
      `ID bài học đã tồn tại: ${lesson.id}`,
    );
  }
  course.lessons.push(lesson);
  await saveCatalog(catalog);
  return lesson;
}

export async function updateLesson(
  lessonId: string,
  input: LessonInput,
): Promise<LearnLesson> {
  const catalog = await getCatalog();
  let source: LearnCourse | null = null;
  for (const course of catalog.courses) {
    if (course.lessons.some((l) => l.id === lessonId)) {
      source = course;
      break;
    }
  }
  if (!source) {
    throw new LearnStoreError("LESSON_NOT_FOUND", "Không tìm thấy bài học");
  }
  const existingIds = new Set(
    [...allLessonIds(catalog)].filter((id) => id !== lessonId),
  );
  const lesson = normalizeLessonInput(
    { ...input, id: lessonId },
    existingIds,
  );
  const target = requireCourse(catalog, input.courseId ?? source.id);
  source.lessons = source.lessons.filter((l) => l.id !== lessonId);
  target.lessons.push(lesson);
  await saveCatalog(catalog);
  return lesson;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const catalog = await getCatalog();
  let found = false;
  for (const course of catalog.courses) {
    const next = course.lessons.filter((l) => l.id !== lessonId);
    if (next.length !== course.lessons.length) {
      course.lessons = next;
      found = true;
    }
  }
  if (!found) {
    throw new LearnStoreError("LESSON_NOT_FOUND", "Không tìm thấy bài học");
  }
  const remaining = catalog.courses.reduce((n, c) => n + c.lessons.length, 0);
  if (remaining === 0) {
    await resetCurriculumToSeed();
    return;
  }
  await saveCatalog(catalog);
}

export async function getLessonsBySkill(
  skill: LearnSkill,
  courseId?: string,
): Promise<LearnLesson[]> {
  const catalog = await getCatalog();
  const course = courseId
    ? catalog.courses.find((c) => c.id === courseId)
    : catalog.courses[0];
  if (!course) return [];
  return course.lessons
    .filter((l) => l.skill === skill)
    .sort((a, b) => a.order - b.order);
}

export async function getLessonById(
  lessonId: string,
): Promise<LearnLesson | null> {
  const ctx = await getLessonContext(lessonId);
  return ctx?.lesson ?? null;
}

function emptyProgress(ownerKey: string): LearnProgressStore {
  return {
    ownerKey,
    lessons: {},
    updatedAt: new Date().toISOString(),
  };
}

function progressPath(ownerKey: string) {
  const safe = ownerKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return path.join(PROGRESS_DIR, `${safe}.json`);
}

export async function getProgress(
  ownerKey: string,
): Promise<LearnProgressStore> {
  await ensureLearnDirs();
  try {
    const raw = await readFile(progressPath(ownerKey), "utf8");
    const parsed = JSON.parse(raw) as LearnProgressStore;
    if (parsed && typeof parsed.lessons === "object") return parsed;
  } catch {
    // empty
  }
  return emptyProgress(ownerKey);
}

async function writeProgress(store: LearnProgressStore): Promise<void> {
  await ensureLearnDirs();
  store.updatedAt = new Date().toISOString();
  await writeFile(
    progressPath(store.ownerKey),
    JSON.stringify(store, null, 2),
    "utf8",
  );
}

function ensureLessonEntry(
  store: LearnProgressStore,
  lessonId: string,
): LessonProgress {
  const existing = store.lessons[lessonId];
  if (existing) return existing;
  const created: LessonProgress = {
    lessonId,
    videoCompleted: false,
    exercisePassed: false,
    maxWatchedSec: 0,
    updatedAt: new Date().toISOString(),
  };
  store.lessons[lessonId] = created;
  return created;
}

export async function updateVideoProgress(input: {
  ownerKey: string;
  lessonId: string;
  maxWatchedSec: number;
  videoCompleted?: boolean;
}): Promise<LessonProgress> {
  const store = await getProgress(input.ownerKey);
  const entry = ensureLessonEntry(store, input.lessonId);
  entry.maxWatchedSec = Math.max(entry.maxWatchedSec, input.maxWatchedSec);
  if (input.videoCompleted) entry.videoCompleted = true;
  entry.updatedAt = new Date().toISOString();
  await writeProgress(store);
  return entry;
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function checkExerciseAnswer(
  userAnswer: string,
  accepted: string[],
): boolean {
  const n = normalizeAnswer(userAnswer);
  if (!n) return false;
  return accepted.some((a) => {
    const na = normalizeAnswer(a);
    if (n === na) return true;
    // Allow answering with letter only when option is "A. …"
    if (/^[a-d]$/i.test(n) && na.startsWith(`${n}.`)) return true;
    return false;
  });
}

export async function submitExercises(input: {
  ownerKey: string;
  lessonId: string;
  answers: Record<string, string>;
}): Promise<{
  passed: boolean;
  correct: number;
  total: number;
  results: Record<string, boolean>;
  progress: LessonProgress;
  unlockedNextId: string | null;
}> {
  const ctx = await getLessonContext(input.lessonId);
  if (!ctx) {
    throw new LearnStoreError("LESSON_NOT_FOUND", "Không tìm thấy bài học");
  }
  const { course, lesson } = ctx;

  const store = await getProgress(input.ownerKey);
  const entry = ensureLessonEntry(store, input.lessonId);

  if (!entry.videoCompleted) {
    throw new LearnStoreError(
      "VIDEO_REQUIRED",
      "Bạn cần xem hết video trước khi nộp bài tập",
    );
  }

  const results: Record<string, boolean> = {};
  let correct = 0;
  for (const ex of lesson.exercises) {
    const ok = checkExerciseAnswer(input.answers[ex.id] ?? "", ex.answers);
    results[ex.id] = ok;
    if (ok) correct += 1;
  }
  const total = lesson.exercises.length;
  const passed = total > 0 && correct / total >= PASS_THRESHOLD;

  if (passed) {
    entry.exercisePassed = true;
    entry.updatedAt = new Date().toISOString();
    await writeProgress(store);
  }

  const skillLessons = (await getLessonsBySkill(lesson.skill, course.id)).sort(
    (a, b) => a.order - b.order,
  );
  const idx = skillLessons.findIndex((l) => l.id === lesson.id);
  const next = idx >= 0 ? skillLessons[idx + 1] : undefined;

  return {
    passed,
    correct,
    total,
    results,
    progress: entry,
    unlockedNextId: passed && next ? next.id : null,
  };
}

export class LearnStoreError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
