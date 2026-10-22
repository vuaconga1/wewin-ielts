import "server-only";

type CachedAccessToken = {
  value: string;
  expiresAt: number;
};

let cachedAccessToken: CachedAccessToken | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function isZoomHostAuthConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID?.trim() &&
      process.env.ZOOM_CLIENT_ID?.trim() &&
      process.env.ZOOM_CLIENT_SECRET?.trim(),
  );
}

async function zoomAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.value;
  }

  const accountId = requiredEnv("ZOOM_ACCOUNT_ID");
  const clientId = requiredEnv("ZOOM_CLIENT_ID");
  const clientSecret = requiredEnv("ZOOM_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const url = new URL("https://zoom.us/oauth/token");
  url.searchParams.set("grant_type", "account_credentials");
  url.searchParams.set("account_id", accountId);

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Zoom OAuth failed (${response.status})`);
  }
  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) throw new Error("Zoom OAuth returned no access token");
  cachedAccessToken = {
    value: body.access_token,
    expiresAt: now + Math.max(300, body.expires_in ?? 3600) * 1000,
  };
  return body.access_token;
}

/**
 * "me" (default) is the account owner and uses `GET /users/me/zak`
 * (scope `user:read:zak:admin`). Other hosts use
 * `GET /users/{id}/token?type=zak`, which needs `user:read:token:admin`.
 */
export async function getZoomHostZak(
  zoomUserId = process.env.ZOOM_HOST_USER_ID?.trim() || "me",
): Promise<string> {
  const accessToken = await zoomAccessToken();
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
    throw new Error(`Zoom ZAK request failed (${response.status})`);
  }
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("Zoom returned no ZAK token");
  return body.token;
}
