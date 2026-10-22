import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function bucketId(scope: string, identity: string): string {
  return `${scope}:${createHash("sha256").update(identity).digest("hex")}`;
}

export function requestClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function consumeRateLimit(input: {
  scope: string;
  identity: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
}): Promise<RateLimitResult> {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + input.windowSeconds * 1000);
  const id = bucketId(input.scope, input.identity);
  const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("id", "count", "windowStart", "expiresAt")
    VALUES (${id}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("id") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitBucket"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END
    RETURNING "count", "expiresAt"
  `;
  const row = rows[0] ?? { count: input.limit + 1, expiresAt };
  return {
    allowed: row.count <= input.limit,
    remaining: Math.max(0, input.limit - row.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000),
    ),
  };
}
