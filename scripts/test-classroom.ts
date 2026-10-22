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
