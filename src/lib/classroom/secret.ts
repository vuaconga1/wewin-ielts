import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";

function encryptionKey(): Buffer {
  const configured =
    process.env.CLASSROOM_SECRET_ENCRYPTION_KEY?.trim() ||
    (process.env.NODE_ENV !== "production"
      ? process.env.SESSION_SECRET?.trim()
      : undefined);
  if (!configured || configured.length < 16) {
    throw new Error(
      "CLASSROOM_SECRET_ENCRYPTION_KEY must be configured with at least 16 characters",
    );
  }
  return createHash("sha256").update(configured).digest();
}

export function encryptClassroomSecret(value: string): string {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [VERSION, iv, authTag, encrypted]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

export function decryptClassroomSecret(ciphertext: string | null): string {
  if (!ciphertext) return "";
  const [version, ivRaw, tagRaw, valueRaw] = ciphertext.split(".");
  if (version !== VERSION || !ivRaw || !tagRaw || !valueRaw) {
    throw new Error("Invalid classroom secret");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(valueRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
