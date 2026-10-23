import "server-only";

export type ZoomOAuthCredentials = {
  accountId: string;
  clientId: string;
  clientSecret: string;
};

export class ZoomApiError extends Error {
  constructor(
    readonly code: "ZOOM_OAUTH_FAILED" | "ZOOM_ZAK_FAILED" | "ZOOM_API_FAILED",
    readonly status: number,
    readonly zoomMessage?: string,
  ) {
    super(`${code} (${status})${zoomMessage ? `: ${zoomMessage}` : ""}`);
  }
}

type CachedAccessToken = {
  value: string;
  expiresAt: number;
};

/** Keyed by account + client id so rotating a secret never reuses a stale token. */
const cachedAccessTokens = new Map<string, CachedAccessToken>();

/** Legacy single-account credentials from ZOOM_ACCOUNT_ID / _CLIENT_ID / _CLIENT_SECRET. */
export function envZoomOAuthCredentials(): ZoomOAuthCredentials | null {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  return accountId && clientId && clientSecret
    ? { accountId, clientId, clientSecret }
    : null;
}

async function readZoomMessage(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string; reason?: string };
    return (body.message || body.reason)?.slice(0, 300);
  } catch {
    return undefined;
  }
}

export function forgetZoomAccessToken(credentials: ZoomOAuthCredentials) {
  cachedAccessTokens.delete(`${credentials.accountId}:${credentials.clientId}`);
}

export async function zoomAccessToken(
  credentials: ZoomOAuthCredentials,
): Promise<string> {
  const cacheKey = `${credentials.accountId}:${credentials.clientId}`;
  const now = Date.now();
  const cached = cachedAccessTokens.get(cacheKey);
  if (cached && cached.expiresAt > now + 60_000) return cached.value;

  const basic = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");
  const url = new URL("https://zoom.us/oauth/token");
  url.searchParams.set("grant_type", "account_credentials");
  url.searchParams.set("account_id", credentials.accountId);

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new ZoomApiError(
      "ZOOM_OAUTH_FAILED",
      response.status,
      await readZoomMessage(response),
    );
  }
  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) {
    throw new ZoomApiError("ZOOM_OAUTH_FAILED", 502, "No access token");
  }
  cachedAccessTokens.set(cacheKey, {
    value: body.access_token,
    expiresAt: now + Math.max(300, body.expires_in ?? 3600) * 1000,
  });
  return body.access_token;
}

/**
 * "me" (default) is the account owner and uses `GET /users/me/zak`
 * (scope `user:read:zak:admin`). Other hosts use
 * `GET /users/{id}/token?type=zak`, which needs `user:read:token:admin`.
 */
export async function getZoomHostZak(
  credentials: ZoomOAuthCredentials,
  zoomUserId = "me",
): Promise<string> {
  const accessToken = await zoomAccessToken(credentials);
  const endpoint =
    zoomUserId === "me"
      ? new URL("https://api.zoom.us/v2/users/me/zak")
      : new URL(
          `https://api.zoom.us/v2/users/${encodeURIComponent(zoomUserId)}/token`,
        );
  if (zoomUserId !== "me") endpoint.searchParams.set("type", "zak");
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new ZoomApiError(
      "ZOOM_ZAK_FAILED",
      response.status,
      await readZoomMessage(response),
    );
  }
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new ZoomApiError("ZOOM_ZAK_FAILED", 502, "No ZAK token");
  return body.token;
}

export async function zoomApiRequest<T>(
  credentials: ZoomOAuthCredentials,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  init: { query?: Record<string, string>; body?: unknown } = {},
): Promise<T | null> {
  const accessToken = await zoomAccessToken(credentials);
  const url = new URL(`https://api.zoom.us/v2${path}`);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new ZoomApiError(
      "ZOOM_API_FAILED",
      response.status,
      await readZoomMessage(response),
    );
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}
