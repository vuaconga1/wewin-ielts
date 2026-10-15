CREATE TYPE "AccessPlan" AS ENUM ('FREE', 'PAID', 'UNLIMITED');

ALTER TABLE "User"
  ADD COLUMN "accessPlan" "AccessPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "accessStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "accessExpiresAt" TIMESTAMP(3);

-- Existing accounts remain usable; new free students receive seven days in application code.
UPDATE "User" SET "accessPlan" = 'UNLIMITED' WHERE "accessExpiresAt" IS NULL;

CREATE INDEX "User_accessPlan_accessExpiresAt_idx"
  ON "User"("accessPlan", "accessExpiresAt");
