-- AlterEnum
ALTER TYPE "DictationMode" ADD VALUE 'QUESTION_ANSWER';

-- AlterTable
ALTER TABLE "DictationExercise" ADD COLUMN "questions" JSONB;

-- AlterTable
ALTER TABLE "DictationAttempt" ADD COLUMN "questionResults" JSONB;
