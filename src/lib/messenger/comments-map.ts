/** Minimal Graph shapes for comment mapping (kept free of server-only). */
export type GraphCommentFrom = {
  id?: string;
  name?: string;
};

export type GraphComment = {
  id: string;
  message?: string;
  created_time?: string;
  from?: GraphCommentFrom;
  comments?: { data?: GraphComment[] };
};

export type GraphFeedPost = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  comments?: { data?: GraphComment[] };
};

export const FACEBOOK_COMMENT_CHANNEL = "FACEBOOK_COMMENT";

export type FacebookCommentMessage = {
  role: "visitor" | "bot" | "unknown";
  text: string;
  createdAt: string;
};

export type FacebookCommentEnvelope = {
  source: "facebook-comment";
  data: {
    id: string;
    name: string;
    channel: typeof FACEBOOK_COMMENT_CHANNEL;
    status: "open";
    postId: string;
    postSnippet: string | null;
    permalink: string | null;
    conversations: Array<{
      channel: typeof FACEBOOK_COMMENT_CHANNEL;
      messages: FacebookCommentMessage[];
    }>;
  };
};

function mapRole(
  fromId: string | undefined,
  pageId: string,
): FacebookCommentMessage["role"] {
  if (!fromId) return "unknown";
  if (fromId === pageId) return "bot";
  return "visitor";
}

function commentText(comment: GraphComment): string | null {
  const text = comment.message?.trim();
  if (!text) return null;
  return text.slice(0, 4000);
}

function commentCreatedAt(comment: GraphComment): string {
  if (comment.created_time) {
    const d = new Date(comment.created_time);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function flattenThread(
  top: GraphComment,
  pageId: string,
): FacebookCommentMessage[] {
  const out: FacebookCommentMessage[] = [];
  const topText = commentText(top);
  if (topText) {
    out.push({
      role: mapRole(top.from?.id, pageId),
      text: topText,
      createdAt: commentCreatedAt(top),
    });
  }
  for (const reply of top.comments?.data ?? []) {
    const text = commentText(reply);
    if (!text) continue;
    out.push({
      role: mapRole(reply.from?.id, pageId),
      text,
      createdAt: commentCreatedAt(reply),
    });
  }
  return out;
}

function postSnippet(post: GraphFeedPost): string | null {
  const text = post.message?.trim();
  if (!text) return null;
  return text.slice(0, 280);
}

/** Pure mapping: Graph top-level comment → Chat History envelope. */
export function buildFacebookCommentEnvelope(input: {
  post: GraphFeedPost;
  comment: GraphComment;
  pageId: string;
}): FacebookCommentEnvelope | null {
  const messages = flattenThread(input.comment, input.pageId);
  if (!messages.length) return null;

  const contactName =
    input.comment.from?.name?.trim() ||
    (mapRole(input.comment.from?.id, input.pageId) === "bot"
      ? "Page"
      : "Facebook commenter");

  return {
    source: "facebook-comment",
    data: {
      id: input.comment.id,
      name: contactName,
      channel: FACEBOOK_COMMENT_CHANNEL,
      status: "open",
      postId: input.post.id,
      postSnippet: postSnippet(input.post),
      permalink: input.post.permalink_url?.trim() || null,
      conversations: [
        {
          channel: FACEBOOK_COMMENT_CHANNEL,
          messages,
        },
      ],
    },
  };
}

export function facebookCommentExternalId(commentId: string): string {
  return `fbcomment:${commentId}`;
}

export function extractFacebookPostContext(raw: unknown): {
  postId: string | null;
  postSnippet: string | null;
  permalink: string | null;
} | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const root = raw as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : null;
  if (!data) return null;
  const postId = typeof data.postId === "string" ? data.postId.trim() : "";
  const postSnippet =
    typeof data.postSnippet === "string" ? data.postSnippet.trim() : "";
  const permalink =
    typeof data.permalink === "string" ? data.permalink.trim() : "";
  if (!postId && !postSnippet && !permalink) return null;
  return {
    postId: postId || null,
    postSnippet: postSnippet || null,
    permalink: permalink || null,
  };
}
