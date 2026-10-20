-- CreateTable
CREATE TABLE "ShadowingExercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT,
    "instructions" TEXT,
    "audioUrl" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "maxRecordSeconds" INTEGER NOT NULL DEFAULT 30,
    "status" "TestStatus" NOT NULL DEFAULT 'PUBLISHED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShadowingExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShadowingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sttProvider" TEXT NOT NULL,
    "recognizedText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "wer" DOUBLE PRECISION NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "substitutionCount" INTEGER NOT NULL,
    "deletionCount" INTEGER NOT NULL,
    "insertionCount" INTEGER NOT NULL,
    "wordResults" JSONB NOT NULL,
    "errorSummary" JSONB NOT NULL,
    "recordingKey" TEXT,
    "recordingMime" TEXT,
    "recordingMs" INTEGER,
    "recordingExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShadowingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShadowingExercise_slug_key" ON "ShadowingExercise"("slug");
CREATE INDEX "ShadowingExercise_status_order_idx" ON "ShadowingExercise"("status", "order");
CREATE INDEX "ShadowingAttempt_userId_exerciseId_createdAt_idx" ON "ShadowingAttempt"("userId", "exerciseId", "createdAt");
CREATE INDEX "ShadowingAttempt_exerciseId_createdAt_idx" ON "ShadowingAttempt"("exerciseId", "createdAt");
CREATE INDEX "ShadowingAttempt_recordingExpiresAt_idx" ON "ShadowingAttempt"("recordingExpiresAt");

-- AddForeignKey
ALTER TABLE "ShadowingAttempt" ADD CONSTRAINT "ShadowingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShadowingAttempt" ADD CONSTRAINT "ShadowingAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "ShadowingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
