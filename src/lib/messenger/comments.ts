import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getMessengerConfig } from "@/lib/messenger/config";
import { listPageCommentThreads } from "@/lib/messenger/graph";
import {
  FACEBOOK_COMMENT_CHANNEL,
  buildFacebookCommentEnvelope,
  facebookCommentExternalId,
  type GraphComment,
  type GraphFeedPost,
} from "@/lib/messenger/comments-map";

export {
  FACEBOOK_COMMENT_CHANNEL,
  buildFacebookCommentEnvelope,
  facebookCommentExternalId,
} from "@/lib/messenger/comments-map";

export async function upsertFacebookCommentThread(input: {
  post: GraphFeedPost;
  comment: GraphComment;
  pageId: string;
}): Promise<boolean> {
  const envelope = buildFacebookCommentEnvelope(input);
  if (!envelope) return false;

  const externalId = facebookCommentExternalId(input.comment.id);
  const lastMessage =
    envelope.data.conversations[0]?.messages.at(-1)?.text?.slice(0, 2000) ??
    null;
  const startedRaw = envelope.data.conversations[0]?.messages[0]?.createdAt;
  const startedAt = startedRaw ? new Date(startedRaw) : new Date();
  const rawPayload = envelope as unknown as Prisma.InputJsonValue;

  await prisma.fastbotsConversation.upsert({
    where: { externalId },
    create: {
      externalId,
      contactName: envelope.data.name,
      channel: FACEBOOK_COMMENT_CHANNEL,
      conversationType: "COMMENT",
      lastMessage,
      status: "OPEN",
      startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
      tags: ["facebook", "comment"],
      rawPayload,
    },
    update: {
      contactName: envelope.data.name,
      channel: FACEBOOK_COMMENT_CHANNEL,
      conversationType: "COMMENT",
      lastMessage,
      status: "OPEN",
      ...(Number.isNaN(startedAt.getTime()) ? {} : { startedAt }),
      tags: ["facebook", "comment"],
      rawPayload,
    },
  });

  return true;
}

/** Pull recent Page post comments into admin Chat History. */
export async function syncFacebookCommentThreads(input?: {
  limitPosts?: number;
  commentsPerPost?: number;
  repliesPerComment?: number;
}): Promise<{ synced: number; posts: number }> {
  const config = getMessengerConfig();
  if (!config) {
    return { synced: 0, posts: 0 };
  }

  const posts = await listPageCommentThreads({
    limitPosts: input?.limitPosts ?? 20,
    commentsPerPost: input?.commentsPerPost ?? 25,
    repliesPerComment: input?.repliesPerComment ?? 15,
  });

  let synced = 0;
  for (const post of posts) {
    for (const comment of post.comments?.data ?? []) {
      const ok = await upsertFacebookCommentThread({
        post,
        comment,
        pageId: config.pageId,
      });
      if (ok) synced += 1;
    }
  }

  return { synced, posts: posts.length };
}
