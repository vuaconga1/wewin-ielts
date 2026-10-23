-- AlterTable
ALTER TABLE "User" ADD COLUMN "zoomAccountId" TEXT,
ADD COLUMN "zoomUserId" TEXT,
ADD COLUMN "zoomUserEmail" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoomAccountId_fkey"
FOREIGN KEY ("zoomAccountId") REFERENCES "ZoomAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
