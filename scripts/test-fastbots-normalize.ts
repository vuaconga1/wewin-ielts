import assert from "node:assert/strict";
import {
  expandFastbotsWebhookRecord,
  extractMessagesFromRawPayload,
  extractWebhookRecords,
  normalizeFastbotsPayload,
} from "../src/lib/fastbots/normalize";

function main() {
  const sample = {
    event: "contact.created",
    source: "fastbots-app",
    version: "1.0",
    timestamp: "2026-11-21T08:42:58.480Z",
    data: {
      id: "test_sample",
      name: "Test Contact",
      email: "test.contact@example.com",
      phone: "+1 555 0100",
      status: "lead",
      channel: "API",
      conversations: [
        {
          channel: "WEB",
          messages: [
            {
              role: "bot",
              text: "Hi! How can I help you today?",
              createdAt: "2026-07-24T10:14:02.000Z",
            },
            {
              role: "visitor",
              text: "Do you have an enterprise plan?",
              createdAt: "2026-07-24T10:14:20.000Z",
            },
          ],
        },
        {
          channel: "WHATSAPP",
          messages: [
            {
              role: "visitor",
              text: "Following up here on WhatsApp",
              createdAt: "2026-07-24T11:02:10.000Z",
            },
          ],
        },
      ],
    },
  };

  const records = extractWebhookRecords(sample);
  assert.equal(records.length, 1);

  const expanded = expandFastbotsWebhookRecord(sample);
  assert.equal(expanded.length, 2);
  assert.equal(expanded[0]?.externalId, "test_sample::WEB");
  assert.equal(expanded[0]?.lastMessage, "Do you have an enterprise plan?");
  assert.equal(expanded[1]?.externalId, "test_sample::WHATSAPP");
  assert.equal(expanded[1]?.channel, "WHATSAPP");

  const msgs = extractMessagesFromRawPayload(sample, "WEB");
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0]?.role, "bot");

  const nested = normalizeFastbotsPayload({
    contact: { id: "c1", name: "Lan", status: "open" },
    conversation: {
      id: "chat-9",
      channel: "facebook",
      lastMessage: "hôm nay đóng học phí",
    },
  });
  assert.equal(nested?.externalId, "chat-9");
  assert.equal(nested?.lastMessage, "hôm nay đóng học phí");

  console.log("test-fastbots-normalize: ok");
}

main();
