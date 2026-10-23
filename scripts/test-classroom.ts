import { strict as assert } from "node:assert";
import { resolveClassroomPrivileges } from "../src/lib/classroom/authorization";
import {
  newerPresentationState,
  slideManifestSchema,
  type PublicPresentationState,
} from "../src/lib/classroom/types";
import {
  decryptClassroomSecret,
  encryptClassroomSecret,
} from "../src/lib/classroom/secret";
import {
  createMeetingSdkSignature,
  normalizeZoomMeetingNumber,
} from "../src/lib/zoom/sdk-signature";
import {
  expandWeeklyWallTimes,
  utcToZonedWallTime,
  zonedWallTimeToUtc,
} from "../src/lib/classroom/schedule-time";

process.env.ZOOM_MEETING_SDK_KEY = "sdk-test-key";
process.env.ZOOM_MEETING_SDK_SECRET = "sdk-test-secret";
process.env.CLASSROOM_SECRET_ENCRYPTION_KEY =
  "test-only-classroom-key-with-more-than-32-characters";

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const encoded = jwt.split(".")[1];
  assert(encoded, "JWT payload exists");
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

const participant = decodeJwtPayload(
  createMeetingSdkSignature({
    meetingNumber: "123 456 789",
    role: 0,
    now: new Date("2026-10-22T00:00:00Z"),
  }),
);
assert.equal(participant.mn, "123456789");
assert.equal(participant.role, 0);
assert.equal(participant.sdkKey, "sdk-test-key");
assert.equal(participant.video_webrtc_mode, 1);
assert.equal(participant.audio_webrtc_mode, 1);
assert(
  Number(participant.exp) - Number(participant.iat) >= 1800,
  "Zoom JWT respects the minimum lifetime",
);
const perAccount = decodeJwtPayload(
  createMeetingSdkSignature({
    meetingNumber: "98765432101",
    role: 1,
    credentials: { sdkKey: "db-account-key", sdkSecret: "db-account-secret" },
  }),
);
assert.equal(perAccount.sdkKey, "db-account-key");
assert.equal(perAccount.role, 1);

assert.equal(
  zonedWallTimeToUtc("2026-10-26T19:00", "Asia/Ho_Chi_Minh")?.toISOString(),
  "2026-10-26T12:00:00.000Z",
);
assert.equal(
  utcToZonedWallTime(new Date("2026-10-26T12:00:00Z"), "Asia/Ho_Chi_Minh"),
  "2026-10-26T19:00",
);
assert.equal(
  zonedWallTimeToUtc("2026-07-01T09:00", "America/New_York")?.toISOString(),
  "2026-07-01T13:00:00.000Z",
);
assert.equal(zonedWallTimeToUtc("not-a-date", "Asia/Ho_Chi_Minh"), null);
// 2026-10-26 is a Monday; Mon/Wed/Fri through Sunday 2026-11-08 → 6 sessions.
assert.deepEqual(
  expandWeeklyWallTimes({
    startWallTime: "2026-10-26T19:00",
    weekdays: [1, 3, 5],
    untilDate: "2026-11-08",
  }),
  [
    "2026-10-26T19:00",
    "2026-10-28T19:00",
    "2026-10-30T19:00",
    "2026-11-02T19:00",
    "2026-11-04T19:00",
    "2026-11-06T19:00",
  ],
);
assert.equal(
  expandWeeklyWallTimes({
    startWallTime: "2026-01-01T19:00",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    untilDate: "2026-12-31",
  }).length,
  51,
  "expansion stops one past the series limit",
);

assert.equal(normalizeZoomMeetingNumber("123-456-789"), "123456789");
assert.throws(() => normalizeZoomMeetingNumber("123"));

const encrypted = encryptClassroomSecret("private-passcode");
assert(!encrypted.includes("private-passcode"));
assert.equal(decryptClassroomSecret(encrypted), "private-passcode");
assert.throws(() =>
  decryptClassroomSecret(`${encrypted.slice(0, -2)}aa`),
);

assert.deepEqual(
  resolveClassroomPrivileges({
    actorId: "student-1",
    role: "STUDENT",
    learnerAccessExpired: false,
    enrolled: true,
    teacherRole: null,
    sessionHostUserId: "teacher-1",
  }),
  { allowed: true, canControl: false, canHost: false },
);
assert.equal(
  resolveClassroomPrivileges({
    actorId: "student-2",
    role: "STUDENT",
    learnerAccessExpired: false,
    enrolled: false,
    teacherRole: null,
    sessionHostUserId: "teacher-1",
  }).allowed,
  false,
);
assert.equal(
  resolveClassroomPrivileges({
    actorId: "visitor-1",
    role: "VISITOR",
    learnerAccessExpired: false,
    enrolled: true,
    teacherRole: null,
    sessionHostUserId: null,
  }).allowed,
  false,
);
assert.deepEqual(
  resolveClassroomPrivileges({
    actorId: "teacher-1",
    role: "TEACHER",
    learnerAccessExpired: false,
    enrolled: false,
    teacherRole: "HOST",
    sessionHostUserId: "teacher-1",
  }),
  { allowed: true, canControl: true, canHost: true },
);
assert.equal(
  resolveClassroomPrivileges({
    actorId: "teacher-2",
    role: "TEACHER",
    learnerAccessExpired: false,
    enrolled: false,
    teacherRole: "HOST",
    sessionHostUserId: "teacher-1",
  }).canHost,
  false,
);
assert.deepEqual(
  resolveClassroomPrivileges({
    actorId: "admin-1",
    role: "ADMIN",
    learnerAccessExpired: false,
    enrolled: false,
    teacherRole: null,
    sessionHostUserId: "teacher-1",
  }),
  { allowed: true, canControl: true, canHost: true },
);

assert.equal(
  slideManifestSchema.safeParse([
    { id: "slide-1", imageUrl: "https://cdn.example/1.webp" },
  ]).success,
  true,
);
assert.equal(
  slideManifestSchema.safeParse([
    { id: "slide-2", imageUrl: "/uploads/slides/2.webp" },
  ]).success,
  true,
);
assert.equal(slideManifestSchema.safeParse([]).success, false);
assert.equal(
  slideManifestSchema.safeParse([
    { id: "unsafe", imageUrl: "javascript:alert(1)" },
  ]).success,
  false,
);

const state: PublicPresentationState = {
  liveSessionId: "session-1",
  presentationId: "presentation-1",
  slideIndex: 0,
  version: 2,
  mode: "WEWIN_SLIDES",
  updatedAt: "2026-10-22T00:00:00.000Z",
};
assert.equal(
  newerPresentationState(state, { ...state, slideIndex: 1, version: 3 })
    .slideIndex,
  1,
);
assert.equal(
  newerPresentationState(state, { ...state, slideIndex: 2, version: 1 })
    .slideIndex,
  0,
);
assert.equal(
  newerPresentationState(state, {
    ...state,
    liveSessionId: "other-session",
    version: 99,
  }).liveSessionId,
  "session-1",
);

console.log("classroom security and state tests passed");
