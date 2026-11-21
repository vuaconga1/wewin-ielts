import "server-only";

const GRAPH_VERSION = "v21.0";

export function getMessengerConfig(): {
  pageId: string;
  pageAccessToken: string;
  verifyToken: string | null;
  appSecret: string | null;
  graphBase: string;
} | null {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim() || "";
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || "";
  if (!pageId || !pageAccessToken) return null;
  return {
    pageId,
    pageAccessToken,
    verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN?.trim() || null,
    appSecret: process.env.FACEBOOK_APP_SECRET?.trim() || null,
    graphBase: `https://graph.facebook.com/${GRAPH_VERSION}`,
  };
}

export function isMessengerConfigured(): boolean {
  return Boolean(getMessengerConfig());
}
