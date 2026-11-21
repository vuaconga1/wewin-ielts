import assert from "node:assert/strict";
import {
  extractWebhookRecords,
  normalizeFastbotsPayload,
} from "../src/lib/fastbots/normalize";

function main() {
  const nested = normalizeFastbotsPayload({
    contact: { id: "c1", name: "Lan", email: "lan@example.com", status: "open" },
    conversation: {
      id: "chat-9",
      channel: "facebook",
      type: "text",
      lastMessage: "hôm nay đóng học phí",
      startedAt: "2026-11-19T10:00:00.000Z",
    },
  });
  assert.equal(nested?.externalId, "chat-9");
  assert.equal(nested?.contactName, "Lan");
  assert.equal(nested?.lastMessage, "hôm nay đóng học phí");
  assert.equal(nested?.status, "OPEN");
  assert.equal(nested?.channel, "facebook");

  const flat = normalizeFastbotsPayload({
    id: "anon-1",
    name: "Anonymous visitor",
    status: "closed",
    message: "Great photos",
  });
  assert.equal(flat?.externalId, "anon-1");
  assert.equal(flat?.status, "CLOSED");
  assert.equal(flat?.lastMessage, "Great photos");

  assert.equal(normalizeFastbotsPayload({ name: "no-id" }), null);

  const records = extractWebhookRecords({
    contacts: [{ id: "a" }, { id: "b" }],
  });
  assert.equal(records.length, 2);

  console.log("test-fastbots-normalize: ok");
}

main();
