-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ClassTeacherRole" AS ENUM ('HOST', 'CO_HOST');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "PresentationMode" AS ENUM ('NONE', 'WEWIN_SLIDES', 'ZOOM_SCREEN_SHARE');

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "status" "ClassroomStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassTeacher" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClassTeacherRole" NOT NULL DEFAULT 'HOST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "hostUserId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "zoomMeetingId" TEXT NOT NULL,
    "zoomHostUserId" TEXT,
    "zoomPasscodeCiphertext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "slides" JSONB NOT NULL,
    "slideCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PresentationState" (
    "id" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "presentationId" TEXT,
    "slideIndex" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "mode" "PresentationMode" NOT NULL DEFAULT 'NONE',
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PresentationState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_code_key" ON "Classroom"("code");
CREATE INDEX "Classroom_status_code_idx" ON "Classroom"("status", "code");
CREATE UNIQUE INDEX "ClassEnrollment_classroomId_userId_key" ON "ClassEnrollment"("classroomId", "userId");
CREATE INDEX "ClassEnrollment_userId_status_idx" ON "ClassEnrollment"("userId", "status");
CREATE UNIQUE INDEX "ClassTeacher_classroomId_userId_key" ON "ClassTeacher"("classroomId", "userId");
CREATE INDEX "ClassTeacher_userId_role_idx" ON "ClassTeacher"("userId", "role");
CREATE INDEX "LiveSession_classroomId_scheduledStart_idx" ON "LiveSession"("classroomId", "scheduledStart");
CREATE INDEX "LiveSession_hostUserId_scheduledStart_idx" ON "LiveSession"("hostUserId", "scheduledStart");
CREATE INDEX "LiveSession_zoomMeetingId_idx" ON "LiveSession"("zoomMeetingId");
CREATE INDEX "Presentation_classroomId_createdAt_idx" ON "Presentation"("classroomId", "createdAt");
CREATE UNIQUE INDEX "PresentationState_liveSessionId_key" ON "PresentationState"("liveSessionId");
CREATE INDEX "PresentationState_presentationId_idx" ON "PresentationState"("presentationId");
CREATE INDEX "PresentationState_updatedById_updatedAt_idx" ON "PresentationState"("updatedById", "updatedAt");
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_hostUserId_fkey"
FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PresentationState" ADD CONSTRAINT "PresentationState_liveSessionId_fkey"
FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PresentationState" ADD CONSTRAINT "PresentationState_presentationId_fkey"
FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PresentationState" ADD CONSTRAINT "PresentationState_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill normalized classrooms from the legacy comma-separated User.classCode field.
WITH codes AS (
  SELECT DISTINCT btrim(code) AS code
  FROM "User"
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE("classCode", ''), E'\\s*,\\s*') AS code
  WHERE btrim(code) <> ''
)
INSERT INTO "Classroom" ("id", "code", "name", "updatedAt")
SELECT
  'cls_' || substr(md5(code), 1, 24),
  code,
  code,
  CURRENT_TIMESTAMP
FROM codes
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "ClassEnrollment" ("id", "classroomId", "userId", "updatedAt")
SELECT
  'enr_' || substr(md5(u."id" || ':' || c."id"), 1, 24),
  c."id",
  u."id",
  CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(u."classCode", ''), E'\\s*,\\s*') AS raw_code
JOIN "Classroom" c ON c."code" = btrim(raw_code)
WHERE btrim(raw_code) <> '' AND u."role" IN ('STUDENT', 'VISITOR')
ON CONFLICT ("classroomId", "userId") DO NOTHING;

INSERT INTO "ClassTeacher" ("id", "classroomId", "userId", "updatedAt")
SELECT
  'tch_' || substr(md5(u."id" || ':' || c."id"), 1, 24),
  c."id",
  u."id",
  CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(u."classCode", ''), E'\\s*,\\s*') AS raw_code
JOIN "Classroom" c ON c."code" = btrim(raw_code)
WHERE btrim(raw_code) <> '' AND u."role" = 'TEACHER'
ON CONFLICT ("classroomId", "userId") DO NOTHING;
