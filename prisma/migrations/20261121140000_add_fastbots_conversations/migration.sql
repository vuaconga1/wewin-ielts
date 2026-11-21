-- CreateEnum
CREATE TYPE "FastbotsChatStatus" AS ENUM ('OPEN', 'CLOSED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "FastbotsConversation" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "channel" TEXT,
    "conversationType" TEXT,
    "lastMessage" TEXT,
    "status" "FastbotsChatStatus" NOT NULL DEFAULT 'UNKNOWN',
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FastbotsConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FastbotsConversation_externalId_key" ON "FastbotsConversation"("externalId");

-- CreateIndex
CREATE INDEX "FastbotsConversation_status_startedAt_idx" ON "FastbotsConversation"("status", "startedAt");

-- CreateIndex
CREATE INDEX "FastbotsConversation_startedAt_idx" ON "FastbotsConversation"("startedAt");

-- CreateIndex
CREATE INDEX "FastbotsConversation_updatedAt_idx" ON "FastbotsConversation"("updatedAt");

-- CreateIndex
CREATE INDEX "FastbotsConversation_contactEmail_idx" ON "FastbotsConversation"("contactEmail");
