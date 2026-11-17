-- CreateIndex
CREATE INDEX "Attempt_userId_testId_finishedAt_startedAt_idx" ON "Attempt"("userId", "testId", "finishedAt", "startedAt");

-- CreateIndex
CREATE INDEX "Attempt_finishedAt_idx" ON "Attempt"("finishedAt");

-- CreateIndex
CREATE INDEX "ClassAssignment_deadlineAt_classroomId_idx" ON "ClassAssignment"("deadlineAt", "classroomId");

-- CreateIndex
CREATE INDEX "DictationAttempt_userId_exerciseId_completedAt_idx" ON "DictationAttempt"("userId", "exerciseId", "completedAt");

-- CreateIndex
CREATE INDEX "Test_status_updatedAt_idx" ON "Test"("status", "updatedAt");
