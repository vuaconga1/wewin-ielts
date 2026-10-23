import { createHmac } from "node:crypto";

const SIGNATURE_TTL_SECONDS = 2 * 60 * 60;

export type MeetingSdkCredentials = { sdkKey: string; sdkSecret: string };

function base64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Legacy single-account credentials from ZOOM_MEETING_SDK_KEY / _SECRET. */
export function envMeetingSdkCredentials(): MeetingSdkCredentials | null {
  const sdkKey = process.env.ZOOM_MEETING_SDK_KEY?.trim();
  const sdkSecret = process.env.ZOOM_MEETING_SDK_SECRET?.trim();
  return sdkKey && sdkSecret ? { sdkKey, sdkSecret } : null;
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
  credentials?: MeetingSdkCredentials;
}): string {
  const credentials = input.credentials ?? envMeetingSdkCredentials();
  if (!credentials) throw new Error("Zoom Meeting SDK is not configured");
  const { sdkKey, sdkSecret } = credentials;
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
  const signature = createHmac("sha256", sdkSecret).update(unsigned).digest();
  return `${unsigned}.${base64Url(signature)}`;
}
