import "server-only";
import { getMessengerConfig } from "@/lib/messenger/config";

export type GraphMessage = {
  id: string;
  message?: string;
  created_time?: string;
  from?: { id?: string; name?: string; email?: string };
};

export type GraphConversation = {
  id: string;
  updated_time?: string;
  snippet?: string;
  participants?: {
    data?: Array<{ id?: string; name?: string; email?: string }>;
  };
  messages?: { data?: GraphMessage[] };
};

type GraphList<T> = {
  data?: T[];
  paging?: { next?: string; cursors?: { after?: string } };
  error?: { message?: string; type?: string; code?: number };
};

export class MessengerGraphError extends Error {
  constructor(
    public code: string,
    public status: number,
    message?: string,
  ) {
    super(message || code);
  }
}

async function graphGet<T>(path: string, search: Record<string, string>): Promise<T> {
  const config = getMessengerConfig();
  if (!config) {
    throw new MessengerGraphError("MESSENGER_NOT_CONFIGURED", 503);
  }

  const url = new URL(`${config.graphBase}${path}`);
  for (const [k, v] of Object.entries(search)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", config.pageAccessToken);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const json = (await res.json().catch(() => null)) as
    | (T & { error?: { message?: string; code?: number } })
    | null;

  if (!res.ok || json?.error) {
    throw new MessengerGraphError(
      "FACEBOOK_GRAPH_ERROR",
      res.status >= 400 ? res.status : 502,
      json?.error?.message || "Facebook Graph request failed",
    );
  }

  return json as T;
}

/** List recent Messenger conversations for the configured Page. */
export async function listMessengerConversations(input?: {
  limit?: number;
}): Promise<GraphConversation[]> {
  const config = getMessengerConfig();
  if (!config) {
    throw new MessengerGraphError("MESSENGER_NOT_CONFIGURED", 503);
  }

  const limit = Math.min(50, Math.max(1, input?.limit ?? 25));
  const fields = [
    "id",
    "updated_time",
    "snippet",
    "participants{id,name,email}",
    "messages.limit(30){id,message,created_time,from}",
  ].join(",");

  const page = await graphGet<GraphList<GraphConversation>>(
    `/${config.pageId}/conversations`,
    {
      platform: "messenger",
      limit: String(limit),
      fields,
    },
  );

  return page.data ?? [];
}
