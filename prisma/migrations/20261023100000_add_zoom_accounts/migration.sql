-- CreateTable
CREATE TABLE "ZoomAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretCiphertext" TEXT NOT NULL,
    "sdkKey" TEXT NOT NULL,
    "sdkSecretCiphertext" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL DEFAULT 'me',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ZoomAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ZoomAccount_isDefault_idx" ON "ZoomAccount"("isDefault");

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN "zoomAccountId" TEXT;

ALTER TABLE "LiveSession" ADD COLUMN "zoomAccountId" TEXT,
ADD COLUMN "zoomOccurrenceId" TEXT,
ADD COLUMN "seriesId" TEXT;

CREATE INDEX "LiveSession_zoomAccountId_idx" ON "LiveSession"("zoomAccountId");
CREATE INDEX "LiveSession_seriesId_idx" ON "LiveSession"("seriesId");

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_zoomAccountId_fkey"
FOREIGN KEY ("zoomAccountId") REFERENCES "ZoomAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_zoomAccountId_fkey"
FOREIGN KEY ("zoomAccountId") REFERENCES "ZoomAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
