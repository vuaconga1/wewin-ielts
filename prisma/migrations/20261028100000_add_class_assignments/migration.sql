-- CreateTable
CREATE TABLE "ClassAssignment" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "sectionOrders" INTEGER[],
    "wholeTest" BOOLEAN NOT NULL DEFAULT true,
    "testSlug" TEXT NOT NULL,
    "testTitle" TEXT NOT NULL,
    "skill" "Skill" NOT NULL,
    "partLabel" TEXT,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassAssignment_classroomId_deadlineAt_idx" ON "ClassAssignment"("classroomId", "deadlineAt");
CREATE INDEX "ClassAssignment_testId_idx" ON "ClassAssignment"("testId");

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_classroomId_fkey"
FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_testId_fkey"
FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
