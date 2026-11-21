import type { FastbotsChatStatus } from "@/generated/prisma/client";
import type { FastbotsMessage } from "@/lib/fastbots/normalize";

export type FastbotsChatListItem = {
  id: string;
  externalId: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  channel: string | null;
  conversationType: string | null;
  lastMessage: string | null;
  status: FastbotsChatStatus;
  startedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

export type FastbotsChatListResult = {
  items: FastbotsChatListItem[];
  total: number;
  config: {
    webhookConfigured: boolean;
    dashboardUrl: string;
    webhookPath: string;
  };
};

export type FastbotsChatDetail = FastbotsChatListItem & {
  tags: string[];
  messages: FastbotsMessage[];
};
