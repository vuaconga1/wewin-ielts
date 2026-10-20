-- CreateEnum
CREATE TYPE "DictationMode" AS ENUM ('FULL_TEXT', 'FILL_BLANK');

-- AlterTable
ALTER TABLE "DictationExercise" ADD COLUMN "mode" "DictationMode" NOT NULL DEFAULT 'FULL_TEXT',
ADD COLUMN "gaps" JSONB;

-- AlterTable
ALTER TABLE "DictationAttempt" ADD COLUMN "submittedAnswers" JSONB,
ADD COLUMN "gapResults" JSONB;
