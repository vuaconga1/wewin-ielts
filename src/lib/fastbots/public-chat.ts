import "server-only";

const FASTBOTS_CHAT_URL = "https://app.fastbots.ai/api/public/chat";

export type FastbotsPublicChatResult = {
  chatId: string;
  reply: string;
};

export class FastbotsPublicChatError extends Error {
  constructor(
    public code: string,
    public status: number,
    message?: string,
  ) {
    super(message || code);
  }
}

export function getFastbotsApiKey(): string | null {
  const key = process.env.FASTBOTS_API_KEY?.trim();
  return key || null;
}

/** Call Fastbots public chat API (uses message credits). */
export async function sendFastbotsPublicChat(input: {
  message: string;
  chatId?: string | null;
}): Promise<FastbotsPublicChatResult> {
  const apiKey = getFastbotsApiKey();
  if (!apiKey) {
    throw new FastbotsPublicChatError("FASTBOTS_NOT_CONFIGURED", 503);
  }

  const body: Record<string, string> = { message: input.message };
  if (input.chatId?.trim()) body.chatId = input.chatId.trim();

  const res = await fetch(FASTBOTS_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BOT-API-KEY": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    chatId?: string;
    message?: string;
    reply?: string;
    code?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    throw new FastbotsPublicChatError(
      json?.code || "FASTBOTS_CHAT_FAILED",
      res.status,
      json?.error || json?.message,
    );
  }

  const chatId = typeof json?.chatId === "string" ? json.chatId.trim() : "";
  const reply =
    (typeof json?.message === "string" && json.message) ||
    (typeof json?.reply === "string" && json.reply) ||
    "";

  if (!chatId || !reply) {
    throw new FastbotsPublicChatError("FASTBOTS_BAD_RESPONSE", 502);
  }

  return { chatId, reply };
}
