CREATE TYPE "DictationAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

CREATE TABLE "DictationExercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT,
    "instructions" TEXT,
    "audioUrl" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "settings" JSONB,
    "status" "TestStatus" NOT NULL DEFAULT 'PUBLISHED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DictationExercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DictationAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "exerciseId" TEXT NOT NULL,
    "status" "DictationAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedText" TEXT,
    "normalizedText" TEXT,
    "score" INTEGER,
    "correctCount" INTEGER,
    "totalWords" INTEGER,
    "listenCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "wordResults" JSONB,
    "errorSummary" JSONB,

    CONSTRAINT "DictationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DictationExercise_slug_key" ON "DictationExercise"("slug");
CREATE INDEX "DictationExercise_status_order_idx" ON "DictationExercise"("status", "order");
CREATE INDEX "DictationAttempt_userId_startedAt_idx" ON "DictationAttempt"("userId", "startedAt");
CREATE INDEX "DictationAttempt_exerciseId_idx" ON "DictationAttempt"("exerciseId");
CREATE INDEX "DictationAttempt_userId_exerciseId_startedAt_idx" ON "DictationAttempt"("userId", "exerciseId", "startedAt");

ALTER TABLE "DictationAttempt"
  ADD CONSTRAINT "DictationAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DictationAttempt"
  ADD CONSTRAINT "DictationAttempt_exerciseId_fkey"
  FOREIGN KEY ("exerciseId") REFERENCES "DictationExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
