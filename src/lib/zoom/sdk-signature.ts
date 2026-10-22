import { createHmac } from "node:crypto";

const SIGNATURE_TTL_SECONDS = 2 * 60 * 60;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function zoomMeetingSdkKey(): string {
  const value = process.env.ZOOM_MEETING_SDK_KEY?.trim();
  if (!value) throw new Error("ZOOM_MEETING_SDK_KEY is not configured");
  return value;
}

function zoomMeetingSdkSecret(): string {
  const value = process.env.ZOOM_MEETING_SDK_SECRET?.trim();
  if (!value) throw new Error("ZOOM_MEETING_SDK_SECRET is not configured");
  return value;
}

export function isMeetingSdkConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_MEETING_SDK_KEY?.trim() &&
      process.env.ZOOM_MEETING_SDK_SECRET?.trim(),
  );
}

export function normalizeZoomMeetingNumber(value: string): string {
  const meetingNumber = value.replace(/\s|-/g, "");
  if (!/^\d{9,11}$/.test(meetingNumber)) {
    throw new Error("Invalid Zoom meeting number");
  }
  return meetingNumber;
}

export function createMeetingSdkSignature(input: {
  meetingNumber: string;
  role: 0 | 1;
  now?: Date;
}): string {
  const sdkKey = zoomMeetingSdkKey();
  const secret = zoomMeetingSdkSecret();
  const meetingNumber = normalizeZoomMeetingNumber(input.meetingNumber);
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const issuedAt = nowSeconds - 30;
  const expiresAt = issuedAt + SIGNATURE_TTL_SECONDS;
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    appKey: sdkKey,
    sdkKey,
    mn: meetingNumber,
    role: input.role,
    iat: issuedAt,
    exp: expiresAt,
    tokenExp: expiresAt,
    video_webrtc_mode: 1,
    audio_webrtc_mode: 1,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest();
  return `${unsigned}.${base64Url(signature)}`;
}
