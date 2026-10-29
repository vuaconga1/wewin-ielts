"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ExternalLink,
  Loader2,
  Pencil,
  RefreshCw,
  Repeat,
  Save,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import {
  expandWeeklyWallTimes,
  MAX_SERIES_OCCURRENCES,
  utcToZonedWallTime,
  wallTimeWeekday,
} from "@/lib/classroom/schedule-time";
import type { ManagedClassroomDetail } from "@/lib/classroom/manage";
import { friendlyError } from "@/lib/ui/friendly-error";
import type { ZoomAccountOption } from "./classes-manager";

const inputCls =
  "w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";
const secondaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60";

type Session = ManagedClassroomDetail["sessions"][number];
type SessionStatus = Session["status"];
type Person = { id: string; username: string; fullName: string | null };
type Notice = { kind: "ok" | "error"; text: string; detail?: string } | null;

const STATUS_FALLBACK: Record<SessionStatus, string> = {
  SCHEDULED: "Sắp diễn ra",
  LIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};
const WEEKDAY_FALLBACK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
/** Monday-first display order of JS weekdays. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function personName(person: Person | null | undefined) {
  if (!person) return "";
  return person.fullName?.trim() || person.username;
}

function formatSessionDate(date: Date, formatter: Intl.DateTimeFormat) {
  return formatter.format(date).replace(/\bTh\s+/g, "Thứ ");
}

function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function ClassDetailManager({
  classroom,
  canManage,
  actorId,
  zoomAccounts,
  candidates,
}: {
  classroom: ManagedClassroomDetail;
  canManage: boolean;
  actorId: string;
  zoomAccounts: ZoomAccountOption[];
  candidates: {
    teachers: Person[];
    students: (Person & { classCode: string | null })[];
  } | null;
}) {
  const { t, locale } = useTranslations("classAdmin");
  const { t: tErrors } = useTranslations("errors");
  const router = useRouter();
  const tz = classroom.timezone;
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        timeZone: tz,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale, tz],
  );

  function errorText(code: string | undefined, raw?: unknown) {
    const generic = t("errors.generic", "Không thực hiện được. Vui lòng thử lại.");
    if (code) return t(`errors.${code}`, { max: MAX_SERIES_OCCURRENCES }, generic);
    return friendlyError(raw, generic, tErrors).message;
  }

  async function call(key: string, url: string, method: string, body?: unknown) {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
        code?: string;
        detail?: string;
      };
      if (!res.ok) {
        setNotice({ kind: "error", text: errorText(data.code), detail: data.detail });
        return null;
      }
      return data;
    } catch (error) {
      setNotice({ kind: "error", text: errorText(undefined, error) });
      return null;
    } finally {
      setBusy(null);
    }
  }

  // ---------- Session create ----------
  const defaultStart = useMemo(() => {
    const next = new Date(Date.now() + 86_400_000);
    return `${utcToZonedWallTime(next, tz).slice(0, 10)}T19:00`;
  }, [tz]);
  const hostOptions = classroom.teachers.filter((teacher) => teacher.role === "HOST");
  const defaultHost = canManage
    ? (hostOptions[0]?.id ?? "")
    : hostOptions.some((teacher) => teacher.id === actorId)
      ? actorId
      : "";
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(defaultStart);
  const [duration, setDuration] = useState("90");
  const [hostId, setHostId] = useState(defaultHost);
  const [sessionZoomId, setSessionZoomId] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [untilDate, setUntilDate] = useState("");

  const occurrenceCount = useMemo(() => {
    if (!repeat || !weekdays.length || !untilDate) return 0;
    return expandWeeklyWallTimes({ startWallTime: start, weekdays, untilDate }).length;
  }, [repeat, weekdays, untilDate, start]);

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function enableRepeat(on: boolean) {
    setRepeat(on);
    if (on && !weekdays.length) {
      const day = wallTimeWeekday(start);
      if (day !== null) setWeekdays([day]);
    }
  }

  async function onCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (repeat && occurrenceCount > MAX_SERIES_OCCURRENCES) {
      setNotice({ kind: "error", text: errorText("TOO_MANY_OCCURRENCES") });
      return;
    }
    const data = await call("create", `/api/admin/classes/${classroom.id}/sessions`, "POST", {
      title,
      startWallTime: start,
      durationMinutes: Number(duration),
      hostUserId: hostId || null,
      ...(canManage && sessionZoomId ? { zoomAccountId: sessionZoomId } : {}),
      repeat: repeat ? { weekdays, untilDate } : null,
    });
    if (!data) return;
    setShowCreate(false);
    setTitle("");
    setRepeat(false);
    setWeekdays([]);
    setUntilDate("");
    setNotice({
      kind: "ok",
      text: t(
        "sessionsCreated",
        { n: Number(data.count ?? 1), meeting: String(data.meetingId ?? "") },
        "Đã tạo {n} buổi học (Zoom Meeting ID {meeting}).",
      ),
    });
    router.refresh();
  }

  // ---------- Session edit / delete ----------
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editDuration, setEditDuration] = useState("90");
  const [editHost, setEditHost] = useState("");
  const [editStatus, setEditStatus] = useState<SessionStatus>("SCHEDULED");

  function startEdit(session: Session) {
    setEditing(session.id);
    setEditTitle(session.title);
    setEditStart(session.startWallTime);
    setEditDuration(String(session.durationMinutes));
    setEditHost(session.host?.id ?? "");
    setEditStatus(session.status);
  }

  async function onSaveSession(session: Session) {
    const body: Record<string, unknown> = {
      title: editTitle,
      durationMinutes: Number(editDuration),
      hostUserId: editHost || null,
      status: editStatus,
    };
    if (editStart !== session.startWallTime) body.startWallTime = editStart;
    const ok = await call(`save:${session.id}`, `/api/admin/class-sessions/${session.id}`, "PATCH", body);
    if (!ok) return;
    setEditing(null);
    setNotice({ kind: "ok", text: t("sessionSaved", "Đã cập nhật buổi học.") });
    router.refresh();
  }

  async function onDeleteSession(session: Session, scope: "one" | "series") {
    const message =
      scope === "series"
        ? t("confirmDeleteSeries", "Xóa TOÀN BỘ các buổi trong lịch lặp lại này? Phòng Zoom tương ứng cũng sẽ bị xóa.")
        : t("confirmDeleteSession", "Xóa buổi học này? Phòng Zoom tương ứng cũng sẽ bị xóa.");
    if (!window.confirm(message)) return;
    const data = await call(
      `delete:${session.id}:${scope}`,
      `/api/admin/class-sessions/${session.id}${scope === "series" ? "?scope=series" : ""}`,
      "DELETE",
    );
    if (!data) return;
    setNotice({
      kind: "ok",
      text: t("sessionsDeleted", { n: Number(data.deleted ?? 1) }, "Đã xóa {n} buổi học."),
    });
    router.refresh();
  }

  // ---------- Members (admin) ----------
  const [teacherPick, setTeacherPick] = useState("");
  const [teacherRole, setTeacherRole] = useState<"HOST" | "CO_HOST">("HOST");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPick, setStudentPick] = useState("");

  const enrolledIds = useMemo(() => new Set(classroom.students.map((s) => s.id)), [classroom.students]);
  const teacherIds = useMemo(() => new Set(classroom.teachers.map((s) => s.id)), [classroom.teachers]);
  const studentMatches = useMemo(() => {
    if (!candidates) return [];
    const q = foldText(studentQuery.trim());
    return candidates.students
      .filter((s) => !enrolledIds.has(s.id))
      .filter(
        (s) =>
          !q ||
          q
            .split(/\s+/)
            .every((part) => foldText(`${s.fullName ?? ""} ${s.username} ${s.classCode ?? ""}`).includes(part)),
      )
      .slice(0, 100);
  }, [candidates, enrolledIds, studentQuery]);

  async function addMember(kind: "teacher" | "student", userId: string) {
    if (!userId) return;
    const ok = await call(`add:${kind}`, `/api/admin/classes/${classroom.id}/members`, "POST", {
      kind,
      userId,
      ...(kind === "teacher" ? { role: teacherRole } : {}),
    });
    if (!ok) return;
    if (kind === "teacher") setTeacherPick("");
    else setStudentPick("");
    router.refresh();
  }

  async function removeMember(kind: "teacher" | "student", person: Person) {
    if (!window.confirm(t("confirmRemoveMember", { name: personName(person) }, "Gỡ {name} khỏi lớp?"))) return;
    if (await call(`remove:${person.id}`, `/api/admin/classes/${classroom.id}/members`, "DELETE", { kind, userId: person.id })) {
      router.refresh();
    }
  }

  async function syncMembers() {
    const data = await call("sync", `/api/admin/classes/${classroom.id}/members`, "POST", { sync: true });
    if (!data) return;
    const synced = (data.synced ?? {}) as { students?: number; teachers?: number };
    setNotice({
      kind: "ok",
      text: t(
        "syncDone",
        { students: synced.students ?? 0, teachers: synced.teachers ?? 0 },
        "Đã thêm {students} học viên và {teachers} giáo viên theo mã lớp.",
      ),
    });
    router.refresh();
  }

  // ---------- Class settings (admin) ----------
  const [className, setClassName] = useState(classroom.name);
  const [classCode, setClassCode] = useState(classroom.code);
  const [classZoom, setClassZoom] = useState(classroom.zoomAccountId ?? "");

  async function saveClass(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call("class", `/api/admin/classes/${classroom.id}`, "PATCH", {
      name: className,
      code: classCode,
      timezone: "Asia/Ho_Chi_Minh",
      zoomAccountId: classZoom || null,
    });
    if (ok) {
      setNotice({ kind: "ok", text: t("classSaved", "Đã lưu thông tin lớp.") });
      router.refresh();
    }
  }

  async function toggleArchive() {
    const next = classroom.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    if (next === "ARCHIVED" && !window.confirm(t("confirmArchive", "Lưu trữ lớp này? Học viên sẽ không vào được lớp nữa."))) {
      return;
    }
    if (await call("archive", `/api/admin/classes/${classroom.id}`, "PATCH", { status: next })) {
      router.refresh();
    }
  }

  const now = Date.now();
  const upcoming = classroom.sessions.filter(
    (s) => new Date(s.start).getTime() + s.durationMinutes * 60_000 >= now,
  );
  const past = classroom.sessions.filter(
    (s) => new Date(s.start).getTime() + s.durationMinutes * 60_000 < now,
  ).reverse();

  function renderSession(session: Session) {
    const isEditing = editing === session.id;
    return (
      <li key={session.id} className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
        {isEditing ? (
          <div className="min-w-0 space-y-3">
            <label className="block min-w-0 space-y-1">
              <span className="text-xs font-semibold text-zinc-700">{t("fieldSessionTitle", "Tiêu đề buổi học")}</span>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
            </label>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block min-w-0 space-y-1">
                <span className="text-xs font-semibold text-zinc-700">{t("fieldStart", "Bắt đầu")}</span>
                <input type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-xs font-semibold text-zinc-700">{t("fieldDuration", "Thời lượng (phút)")}</span>
                <input type="number" min={15} max={600} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-xs font-semibold text-zinc-700">{t("fieldHost", "Giáo viên chủ trì")}</span>
                <select value={editHost} onChange={(e) => setEditHost(e.target.value)} className={inputCls}>
                  <option value="">{t("anyHost", "Bất kỳ giáo viên chủ trì nào")}</option>
                  {hostOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {personName(teacher)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-xs font-semibold text-zinc-700">{t("fieldStatus", "Trạng thái")}</span>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as SessionStatus)} className={inputCls}>
                  {(Object.keys(STATUS_FALLBACK) as SessionStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`, STATUS_FALLBACK[status])}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void onSaveSession(session)} disabled={busy !== null} className={primaryBtn}>
                {busy === `save:${session.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("save", "Lưu")}
              </button>
              <button type="button" onClick={() => setEditing(null)} className={secondaryBtn}>
                <X className="h-4 w-4" />
                {t("cancel", "Hủy")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="break-words font-semibold text-wewin-navy">{session.title}</p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-wewin-blue">
                  {t(`status.${session.status}`, STATUS_FALLBACK[session.status])}
                </span>
                {session.seriesId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    <Repeat className="h-3 w-3" aria-hidden />
                    {t("weekly", "Hàng tuần")}
                  </span>
                ) : null}
              </div>
              <p suppressHydrationWarning className="mt-1 break-words text-sm text-zinc-700">
                {formatSessionDate(new Date(session.start), dateFormatter)} ·{" "}
                {t("minutes", { n: session.durationMinutes }, "{n} phút")}
              </p>
              <p className="mt-0.5 break-words text-xs text-zinc-500">
                {t("hostLabel", "Chủ trì")}: {session.host ? personName(session.host) : t("anyHost", "Bất kỳ giáo viên chủ trì nào")}
                {" · "}
                {t("meetingId", "Meeting ID")}: {session.zoomMeetingId}
                {session.zoomAccountName ? ` · ${session.zoomAccountName}` : ""}
                {!session.managed ? ` · ${t("manualMeeting", "phòng tạo thủ công")}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href={`/classroom/${session.id}`} className={secondaryBtn}>
                <ExternalLink className="h-4 w-4" />
                {t("open", "Vào lớp")}
              </Link>
              <button type="button" onClick={() => startEdit(session)} disabled={busy !== null} className={secondaryBtn}>
                <Pencil className="h-4 w-4" />
                {t("edit", "Sửa")}
              </button>
              <button
                type="button"
                onClick={() => void onDeleteSession(session, "one")}
                disabled={busy !== null}
                className={`${secondaryBtn} border-rose-200 text-rose-600 hover:bg-rose-50`}
              >
                {busy === `delete:${session.id}:one` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {t("delete", "Xóa")}
              </button>
              {session.seriesId ? (
                <button
                  type="button"
                  onClick={() => void onDeleteSession(session, "series")}
                  disabled={busy !== null}
                  className={`${secondaryBtn} border-rose-200 text-rose-600 hover:bg-rose-50`}
                >
                  {busy === `delete:${session.id}:series` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {t("deleteSeries", "Xóa cả lịch")}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {notice ? (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`min-w-0 rounded-xl border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <p className="break-words">{notice.text}</p>
          {notice.detail ? <p className="mt-1 break-words text-xs opacity-80">Zoom: {notice.detail}</p> : null}
        </div>
      ) : null}

      {/* Sessions */}
      <section className="card-outline min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-wewin-navy">{t("sessionsTitle", "Lịch học")}</h2>
          {classroom.status === "ACTIVE" && !showCreate ? (
            <button type="button" onClick={() => setShowCreate(true)} className={primaryBtn}>
              <CalendarPlus className="h-4 w-4" />
              {t("addSession", "Tạo buổi học")}
            </button>
          ) : null}
        </div>

        {showCreate ? (
          <form onSubmit={onCreateSession} className="min-w-0 space-y-4 rounded-xl border border-wewin-border bg-wewin-bg/40 p-3 sm:p-4">
            <label className="block min-w-0 space-y-1">
              <span className="text-sm font-semibold text-zinc-800">{t("fieldSessionTitle", "Tiêu đề buổi học")}</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("sessionTitlePlaceholder", "VD: Writing Task 2 – Opinion essay")}
                className={inputCls}
              />
            </label>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">
                  {repeat ? t("fieldFirstStart", "Buổi đầu tiên") : t("fieldStart", "Bắt đầu")}
                </span>
                <input required type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldDuration", "Thời lượng (phút)")}</span>
                <input required type="number" min={15} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldHost", "Giáo viên chủ trì")}</span>
                <select value={hostId} onChange={(e) => setHostId(e.target.value)} className={inputCls}>
                  <option value="">{t("anyHost", "Bất kỳ giáo viên chủ trì nào")}</option>
                  {hostOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {personName(teacher)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {canManage && zoomAccounts.length > 1 ? (
              <label className="block min-w-0 space-y-1 sm:max-w-sm">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldZoomAccount", "Tài khoản Zoom")}</span>
                <select value={sessionZoomId} onChange={(e) => setSessionZoomId(e.target.value)} className={inputCls}>
                  <option value="">{t("zoomOfClass", "Theo cài đặt của lớp")}</option>
                  {zoomAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <p className="text-xs text-zinc-500">{t("timezoneNote", { tz }, "Giờ theo múi giờ của lớp: {tz}")}</p>

            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => enableRepeat(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              {t("repeatWeekly", "Lặp lại hàng tuần")}
            </label>
            {repeat ? (
              <div className="min-w-0 space-y-3 rounded-xl border border-zinc-200 bg-white p-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("weekdaysLabel", "Các ngày trong tuần")}>
                  {WEEK_ORDER.map((day) => {
                    const on = weekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleWeekday(day)}
                        className={`min-h-10 min-w-11 rounded-xl border px-3 text-sm font-semibold ${
                          on
                            ? "border-wewin-navy bg-wewin-navy text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {t(`weekdays.${day}`, WEEKDAY_FALLBACK[day])}
                      </button>
                    );
                  })}
                </div>
                <label className="block min-w-0 space-y-1 sm:max-w-xs">
                  <span className="text-sm font-semibold text-zinc-800">{t("fieldUntil", "Lặp đến hết ngày")}</span>
                  <input
                    required
                    type="date"
                    value={untilDate}
                    min={start.slice(0, 10)}
                    onChange={(e) => setUntilDate(e.target.value)}
                    className={inputCls}
                  />
                </label>
                {untilDate && weekdays.length ? (
                  <p className={`text-sm ${occurrenceCount > MAX_SERIES_OCCURRENCES ? "text-rose-600" : "text-zinc-600"}`}>
                    {occurrenceCount > MAX_SERIES_OCCURRENCES
                      ? t("errors.TOO_MANY_OCCURRENCES", { max: MAX_SERIES_OCCURRENCES }, "Tối đa {max} buổi cho một lịch lặp lại.")
                      : t("occurrencePreview", { n: occurrenceCount }, "Sẽ tạo {n} buổi học.")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy !== null || (repeat && (!weekdays.length || !occurrenceCount))} className={primaryBtn}>
                {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                {busy === "create" ? t("creatingZoom", "Đang tạo phòng Zoom…") : t("createSession", "Tạo lịch & phòng Zoom")}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className={secondaryBtn}>
                {t("cancel", "Hủy")}
              </button>
            </div>
          </form>
        ) : null}

        {upcoming.length ? (
          <ul className="min-w-0 space-y-2">{upcoming.map(renderSession)}</ul>
        ) : (
          <p className="text-sm text-zinc-600">{t("noUpcoming", "Chưa có buổi học sắp tới.")}</p>
        )}
        {past.length ? (
          <details className="min-w-0">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
              {t("pastSessions", { n: past.length }, "Buổi đã qua (30 ngày gần nhất): {n}")}
            </summary>
            <ul className="mt-2 min-w-0 space-y-2">{past.map(renderSession)}</ul>
          </details>
        ) : null}
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Teachers */}
        <section className="card-outline min-w-0 space-y-3 p-4 sm:p-5">
          <h2 className="text-lg font-bold text-wewin-navy">
            {t("teachersTitle", { n: classroom.teachers.length }, "Giáo viên ({n})")}
          </h2>
          {classroom.teachers.length ? (
            <ul className="min-w-0 divide-y divide-zinc-100">
              {classroom.teachers.map((teacher) => (
                <li key={teacher.id} className="flex min-w-0 items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-zinc-900">{personName(teacher)}</p>
                    <p className="text-xs text-zinc-500">
                      {teacher.role === "HOST" ? t("roleHost", "Chủ trì") : t("roleCoHost", "Đồng chủ trì")} · {teacher.username}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => void removeMember("teacher", teacher)}
                      disabled={busy !== null}
                      className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={t("remove", "Gỡ khỏi lớp")}
                      title={t("remove", "Gỡ khỏi lớp")}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">{t("noTeachers", "Chưa có giáo viên.")}</p>
          )}
          {canManage && candidates ? (
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <select value={teacherPick} onChange={(e) => setTeacherPick(e.target.value)} className={`${inputCls} sm:flex-1`}>
                <option value="">{t("pickTeacher", "Chọn giáo viên…")}</option>
                {candidates.teachers
                  .filter((teacher) => !teacherIds.has(teacher.id))
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {personName(teacher)} ({teacher.username})
                    </option>
                  ))}
              </select>
              <select value={teacherRole} onChange={(e) => setTeacherRole(e.target.value as "HOST" | "CO_HOST")} className={`${inputCls} sm:w-40`}>
                <option value="HOST">{t("roleHost", "Chủ trì")}</option>
                <option value="CO_HOST">{t("roleCoHost", "Đồng chủ trì")}</option>
              </select>
              <button type="button" onClick={() => void addMember("teacher", teacherPick)} disabled={!teacherPick || busy !== null} className={secondaryBtn}>
                <UserPlus className="h-4 w-4" />
                {t("add", "Thêm")}
              </button>
            </div>
          ) : null}
        </section>

        {/* Students */}
        <section className="card-outline min-w-0 space-y-3 p-4 sm:p-5">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-wewin-navy">
              {t("studentsTitle", { n: classroom.students.length }, "Học viên ({n})")}
            </h2>
            {canManage ? (
              <button type="button" onClick={() => void syncMembers()} disabled={busy !== null} className={secondaryBtn}>
                {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {t("syncByCode", "Đồng bộ theo mã lớp")}
              </button>
            ) : null}
          </div>
          {canManage && candidates ? (
            <div className="min-w-0 space-y-2">
              <input
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder={t("searchStudent", "Tìm học viên theo tên, username, mã lớp…")}
                className={inputCls}
              />
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <select value={studentPick} onChange={(e) => setStudentPick(e.target.value)} className={`${inputCls} sm:flex-1`}>
                  <option value="">{t("pickStudent", { n: studentMatches.length }, "Chọn học viên ({n} kết quả)…")}</option>
                  {studentMatches.map((student) => (
                    <option key={student.id} value={student.id}>
                      {personName(student)} ({student.username}){student.classCode ? ` · ${student.classCode}` : ""}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => void addMember("student", studentPick)} disabled={!studentPick || busy !== null} className={secondaryBtn}>
                  <UserPlus className="h-4 w-4" />
                  {t("add", "Thêm")}
                </button>
              </div>
            </div>
          ) : null}
          {classroom.students.length ? (
            <ul className="max-h-96 min-w-0 divide-y divide-zinc-100 overflow-y-auto">
              {classroom.students.map((student) => (
                <li key={student.id} className="flex min-w-0 items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-zinc-900">{personName(student)}</p>
                    <p className="break-words text-xs text-zinc-500">
                      {student.username}
                      {student.classCode ? ` · ${student.classCode}` : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => void removeMember("student", student)}
                      disabled={busy !== null}
                      className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={t("remove", "Gỡ khỏi lớp")}
                      title={t("remove", "Gỡ khỏi lớp")}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">{t("noStudents", "Chưa có học viên.")}</p>
          )}
        </section>
      </div>

      {canManage ? (
        <section className="card-outline min-w-0 space-y-4 p-4 sm:p-5">
          <h2 className="text-lg font-bold text-wewin-navy">{t("settingsTitle", "Cài đặt lớp")}</h2>
          <form onSubmit={saveClass} className="min-w-0 space-y-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldCode", "Mã lớp")}</span>
                <input required value={classCode} onChange={(e) => setClassCode(e.target.value.toUpperCase())} className={inputCls} />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldName", "Tên lớp")}</span>
                <input required value={className} onChange={(e) => setClassName(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-sm font-semibold text-zinc-800">{t("fieldZoomAccount", "Tài khoản Zoom")}</span>
                <select value={classZoom} onChange={(e) => setClassZoom(e.target.value)} className={inputCls}>
                  <option value="">{t("zoomDefault", "Dùng tài khoản mặc định")}</option>
                  {zoomAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="break-words text-xs text-zinc-500">
              {t("zoomChangeNote", "Đổi tài khoản Zoom chỉ áp dụng cho buổi học tạo mới. Buổi đã tạo vẫn dùng phòng của tài khoản cũ — xóa và tạo lại nếu muốn chuyển.")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy !== null} className={primaryBtn}>
                {busy === "class" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("save", "Lưu")}
              </button>
              <button type="button" onClick={() => void toggleArchive()} disabled={busy !== null} className={secondaryBtn}>
                {classroom.status === "ACTIVE" ? t("archive", "Lưu trữ lớp") : t("unarchive", "Mở lại lớp")}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
