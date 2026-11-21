import assert from "node:assert/strict";
import { extractMessagesFromRawPayload } from "../src/lib/fastbots/normalize";
import {
  FACEBOOK_COMMENT_CHANNEL,
  buildFacebookCommentEnvelope,
  extractFacebookPostContext,
  facebookCommentExternalId,
  type GraphComment,
  type GraphFeedPost,
} from "../src/lib/messenger/comments-map";

function main() {
  const pageId = "page_100";
  const post: GraphFeedPost = {
    id: "page_100_post_1",
    message: "Ưu đãi học phí IELTS tháng này — đăng ký tại wewin.edu.vn",
    created_time: "2026-11-20T10:00:00+0000",
    permalink_url: "https://www.facebook.com/wewin/posts/1",
  };
  const comment: GraphComment = {
    id: "comment_top_1",
    message: "Dễ thương",
    created_time: "2026-11-20T12:00:00+0000",
    from: { id: "user_9", name: "Tuyết Minh" },
    comments: {
      data: [
        {
          id: "comment_reply_1",
          message: "Cảm ơn bạn! Xem thêm tại wewin.edu.vn",
          created_time: "2026-11-20T12:30:00+0000",
          from: { id: pageId, name: "WeWin Education VN" },
        },
      ],
    },
  };

  const envelope = buildFacebookCommentEnvelope({ post, comment, pageId });
  assert.ok(envelope);
  assert.equal(envelope!.source, "facebook-comment");
  assert.equal(envelope!.data.channel, FACEBOOK_COMMENT_CHANNEL);
  assert.equal(envelope!.data.name, "Tuyết Minh");
  assert.equal(envelope!.data.postId, post.id);
  assert.ok(envelope!.data.postSnippet?.includes("Ưu đãi học phí"));
  assert.equal(envelope!.data.permalink, post.permalink_url);

  const msgs = extractMessagesFromRawPayload(
    envelope,
    FACEBOOK_COMMENT_CHANNEL,
  );
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0]?.role, "visitor");
  assert.equal(msgs[0]?.text, "Dễ thương");
  assert.equal(msgs[1]?.role, "bot");
  assert.ok(msgs[1]?.text.includes("wewin.edu.vn"));

  const ctx = extractFacebookPostContext(envelope);
  assert.equal(ctx?.postId, post.id);
  assert.equal(ctx?.permalink, post.permalink_url);

  assert.equal(
    facebookCommentExternalId(comment.id),
    "fbcomment:comment_top_1",
  );

  const empty = buildFacebookCommentEnvelope({
    post,
    comment: { id: "empty", from: { id: "u1", name: "A" } },
    pageId,
  });
  assert.equal(empty, null);

  console.log("test-facebook-comment-normalize: ok");
}

main();
