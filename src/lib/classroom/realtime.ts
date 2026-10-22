import "server-only";
import { Rest, type TokenRequest } from "ably";
import type { PublicPresentationState } from "./types";

let restClient: Rest | null = null;

function ablyRest(): Rest {
  const key = process.env.ABLY_API_KEY?.trim();
  if (!key) throw new Error("ABLY_API_KEY is not configured");
  restClient ??= new Rest({ key });
  return restClient;
}

export function isClassroomRealtimeConfigured(): boolean {
  return Boolean(process.env.ABLY_API_KEY?.trim());
}

export function classroomChannel(liveSessionId: string): string {
  return `classroom:${liveSessionId}`;
}

export async function createClassroomTokenRequest(input: {
  liveSessionId: string;
  userId: string;
}): Promise<TokenRequest> {
  return ablyRest().auth.createTokenRequest({
    clientId: input.userId,
    ttl: 60 * 60 * 1000,
    capability: JSON.stringify({
      [classroomChannel(input.liveSessionId)]: ["subscribe"],
    }),
  });
}

export async function publishPresentationState(
  state: PublicPresentationState,
): Promise<void> {
  if (!isClassroomRealtimeConfigured()) return;
  try {
    await ablyRest()
      .channels.get(classroomChannel(state.liveSessionId))
      .publish("presentation-state", state);
  } catch (error) {
    // The durable DB state remains authoritative; clients poll after reconnect.
    console.error("[classroom-realtime] Could not publish state", error);
  }
}
