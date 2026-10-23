import "server-only";
import {
  ZoomApiError,
  zoomApiRequest,
  type ZoomOAuthCredentials,
} from "./host-auth";

type ZoomMeetingResponse = {
  id?: number | string;
  password?: string;
  occurrences?: {
    occurrence_id?: string;
    start_time?: string;
    duration?: number;
    status?: string;
  }[];
};

export type CreatedZoomMeeting = {
  meetingId: string;
  passcode: string;
  occurrences: { occurrenceId: string; start: Date; durationMinutes: number }[];
};

const MEETING_SETTINGS = {
  host_video: true,
  participant_video: false,
  join_before_host: false,
  mute_upon_entry: true,
  waiting_room: false,
  meeting_authentication: false,
  approval_type: 2,
  auto_recording: "none",
};

/** "2026-10-26T19:00" → Zoom local `start_time` (interpreted with `timezone`). */
function zoomLocalTime(wallTime: string): string {
  return `${wallTime}:00`;
}

/**
 * Creates a scheduled meeting (type 2) or, with `weekly`, a recurring meeting
 * with fixed time (type 8) whose occurrences map 1:1 to WEWIN sessions.
 * Zoom generates the passcode according to the account's security settings.
 */
export async function createZoomMeeting(
  credentials: ZoomOAuthCredentials,
  hostUserId: string,
  input: {
    topic: string;
    startWallTime: string;
    timezone: string;
    durationMinutes: number;
    weekly?: { weekdays: number[]; endDateTimeUtc: Date };
  },
): Promise<CreatedZoomMeeting> {
  const body: Record<string, unknown> = {
    topic: input.topic.slice(0, 200),
    type: input.weekly ? 8 : 2,
    start_time: zoomLocalTime(input.startWallTime),
    timezone: input.timezone,
    duration: input.durationMinutes,
    settings: MEETING_SETTINGS,
  };
  if (input.weekly) {
    body.recurrence = {
      type: 2,
      repeat_interval: 1,
      weekly_days: [...new Set(input.weekly.weekdays)]
        .sort((a, b) => a - b)
        .map((day) => day + 1)
        .join(","),
      end_date_time: input.weekly.endDateTimeUtc
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z"),
    };
  }
  const response = await zoomApiRequest<ZoomMeetingResponse>(
    credentials,
    "POST",
    `/users/${encodeURIComponent(hostUserId)}/meetings`,
    { body },
  );
  const meetingId = response?.id != null ? String(response.id) : "";
  if (!/^\d{9,11}$/.test(meetingId)) {
    throw new ZoomApiError("ZOOM_API_FAILED", 502, "Zoom returned no meeting id");
  }
  const occurrences = (response?.occurrences ?? [])
    .filter((item) => item.status !== "deleted" && item.occurrence_id && item.start_time)
    .map((item) => ({
      occurrenceId: String(item.occurrence_id),
      start: new Date(item.start_time!),
      durationMinutes: item.duration ?? input.durationMinutes,
    }))
    .filter((item) => !Number.isNaN(item.start.getTime()));
  return { meetingId, passcode: response?.password ?? "", occurrences };
}

export async function getZoomMeetingOccurrences(
  credentials: ZoomOAuthCredentials,
  meetingId: string,
  fallbackDuration: number,
): Promise<CreatedZoomMeeting["occurrences"]> {
  const response = await zoomApiRequest<ZoomMeetingResponse>(
    credentials,
    "GET",
    `/meetings/${meetingId}`,
  );
  return (response?.occurrences ?? [])
    .filter((item) => item.status !== "deleted" && item.occurrence_id && item.start_time)
    .map((item) => ({
      occurrenceId: String(item.occurrence_id),
      start: new Date(item.start_time!),
      durationMinutes: item.duration ?? fallbackDuration,
    }))
    .filter((item) => !Number.isNaN(item.start.getTime()));
}

export async function updateZoomMeeting(
  credentials: ZoomOAuthCredentials,
  meetingId: string,
  input: {
    topic?: string;
    startWallTime?: string;
    timezone: string;
    durationMinutes?: number;
    occurrenceId?: string | null;
  },
): Promise<void> {
  const body: Record<string, unknown> = { timezone: input.timezone };
  if (input.topic && !input.occurrenceId) body.topic = input.topic.slice(0, 200);
  if (input.startWallTime) body.start_time = zoomLocalTime(input.startWallTime);
  if (input.durationMinutes) body.duration = input.durationMinutes;
  await zoomApiRequest(credentials, "PATCH", `/meetings/${meetingId}`, {
    body,
    query: input.occurrenceId ? { occurrence_id: input.occurrenceId } : undefined,
  });
}

/** Deletes a meeting or one occurrence; a meeting already gone on Zoom counts as deleted. */
export async function deleteZoomMeeting(
  credentials: ZoomOAuthCredentials,
  meetingId: string,
  occurrenceId?: string | null,
): Promise<void> {
  try {
    await zoomApiRequest(credentials, "DELETE", `/meetings/${meetingId}`, {
      query: {
        schedule_for_reminder: "false",
        ...(occurrenceId ? { occurrence_id: occurrenceId } : {}),
      },
    });
  } catch (error) {
    if (error instanceof ZoomApiError && error.status === 404) return;
    throw error;
  }
}
