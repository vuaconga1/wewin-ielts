"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Search, Unlink, Video } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";

type ZoomHostUser = { id: string; email: string; name: string; licensed: boolean };
type AccountOption = {
  id: string;
  name: string;
  users: ZoomHostUser[] | null;
  takenUserIds: string[];
};
type Current = {
  zoomAccountId: string;
  zoomAccountName: string;
  zoomUserId: string;
  zoomUserEmail: string | null;
} | null;

type Notice = { kind: "ok" | "error"; text: string; detail?: string } | null;

export function MyZoomHostCard({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslations("myZoom");
  const { t: tErrors } = useTranslations("errors");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [current, setCurrent] = useState<Current>(null);
  const [picking, setPicking] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [selected, setSelected] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const errorText = useCallback(
    (code?: string, raw?: unknown) =>
      code
        ? t(`errors.${code}`, t("errors.generic", "Không thực hiện được. Vui lòng thử lại."))
        : friendlyError(raw, t("errors.generic", "Không thực hiện được. Vui lòng thử lại."), tErrors)
            .message,
    [t, tErrors],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classroom/zoom-host", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        current?: Current;
        accounts?: AccountOption[];
        code?: string;
      };
      if (!res.ok) {
        setNotice({ kind: "error", text: errorText(data.code) });
        return;
      }
      setAccounts(data.accounts ?? []);
      setCurrent(data.current ?? null);
      setPicking(!data.current);
      setAccountId(data.current?.zoomAccountId ?? data.accounts?.[0]?.id ?? "");
    } catch (error) {
      setNotice({ kind: "error", text: errorText(undefined, error) });
    } finally {
      setLoading(false);
    }
  }, [errorText]);

  useEffect(() => {
    void load();
  }, [load]);

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const users = useMemo(() => {
    const list = account?.users ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [account, query]);

  async function save() {
    const zoomUser = account?.users ? selected : manualEmail.trim();
    if (!account || !zoomUser) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/classroom/zoom-host", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoomAccountId: account.id, zoomUser }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        current?: Current;
        code?: string;
        detail?: string;
      };
      if (!res.ok) {
        setNotice({ kind: "error", text: errorText(data.code), detail: data.detail });
        return;
      }
      setCurrent(data.current ?? null);
      setPicking(false);
      setSelected("");
      setManualEmail("");
      setNotice({ kind: "ok", text: t("saved", "Đã lưu. Các buổi học mới sẽ dùng tài khoản Zoom này.") });
    } catch (error) {
      setNotice({ kind: "error", text: errorText(undefined, error) });
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (!window.confirm(t("confirmUnlink", "Bỏ tài khoản Zoom của bạn? Buổi học mới sẽ dùng tài khoản Zoom mặc định."))) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/classroom/zoom-host", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { code?: string };
        setNotice({ kind: "error", text: errorText(data.code) });
        return;
      }
      setCurrent(null);
      setPicking(true);
    } catch (error) {
      setNotice({ kind: "error", text: errorText(undefined, error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-outline mb-6 min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wewin-accent-blue-bg text-wewin-navy">
            <Video className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-base font-bold text-wewin-navy">
              {t("title", "Tài khoản Zoom của tôi")}
            </h2>
            <p className="mt-0.5 break-words text-sm text-zinc-600">
              {t("subtitle", "Buổi học bạn chủ trì sẽ được tạo trên tài khoản Zoom này. Đổi bất cứ lúc nào.")}
            </p>
          </div>
        </div>
        {current && !picking ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPicking(true);
                setNotice(null);
              }}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
            >
              {t("change", "Đổi tài khoản")}
            </button>
            <button
              type="button"
              onClick={() => void unlink()}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              <Unlink className="h-4 w-4" />
              {t("unlink", "Bỏ chọn")}
            </button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-3 min-w-0 rounded-xl border px-3 py-2 text-sm ${
            notice.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <p className="break-words">{notice.text}</p>
          {notice.detail ? (
            <p className="mt-1 break-words text-xs opacity-80">Zoom: {notice.detail}</p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading", "Đang tải danh sách Zoom…")}
        </p>
      ) : accounts.length === 0 ? (
        <p className="mt-4 break-words rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {isAdmin ? (
            <>
              {t("noAccountsAdmin", "Chưa có tài khoản Zoom nào. Thêm một lần tại trang Tài khoản Zoom, sau đó giáo viên tự chọn ở đây.")}{" "}
              <Link href="/admin/zoom" className="font-semibold underline">
                {t("openZoomAdmin", "Mở trang Tài khoản Zoom")}
              </Link>
            </>
          ) : (
            t("noAccountsTeacher", "Quản trị viên chưa cấu hình Zoom. Hãy liên hệ admin.")
          )}
        </p>
      ) : current && !picking ? (
        <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">
            {t(
              "currentValue",
              {
                user: current.zoomUserEmail || current.zoomUserId,
                account: current.zoomAccountName,
              },
              "Đang dùng: {user} ({account})",
            )}
          </span>
        </div>
      ) : (
        <div className="mt-4 min-w-0 space-y-3">
          {accounts.length > 1 ? (
            <label className="block min-w-0 space-y-1">
              <span className="text-sm font-semibold text-zinc-800">
                {t("accountLabel", "Tài khoản Zoom của trung tâm")}
              </span>
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setSelected("");
                }}
                className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {account?.users ? (
            <>
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder", "Tìm theo tên hoặc email Zoom")}
                  autoComplete="off"
                  className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none focus:border-wewin-navy"
                />
              </div>
              <ul className="max-h-72 min-w-0 space-y-1.5 overflow-y-auto pr-1">
                {users.map((user) => {
                  const taken = account.takenUserIds.includes(user.id);
                  const checked = selected === user.id;
                  return (
                    <li key={user.id}>
                      <label
                        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 ${
                          taken
                            ? "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60"
                            : checked
                              ? "border-wewin-navy bg-wewin-accent-blue-bg"
                              : "border-zinc-200 hover:border-wewin-navy"
                        }`}
                      >
                        <input
                          type="radio"
                          name="zoom-host-user"
                          value={user.id}
                          checked={checked}
                          disabled={taken}
                          onChange={() => setSelected(user.id)}
                          className="h-4 w-4 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-semibold text-zinc-900">
                            {user.name}
                          </span>
                          <span className="block break-all text-xs text-zinc-500">{user.email}</span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            user.licensed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {taken
                            ? t("taken", "Giáo viên khác đang dùng")
                            : user.licensed
                              ? t("licensed", "Có bản quyền")
                              : t("basic", "Basic · 40 phút")}
                        </span>
                      </label>
                    </li>
                  );
                })}
                {users.length === 0 ? (
                  <li className="px-1 text-sm text-zinc-500">{t("noMatch", "Không tìm thấy user Zoom phù hợp.")}</li>
                ) : null}
              </ul>
            </>
          ) : (
            <label className="block min-w-0 space-y-1">
              <span className="text-sm font-semibold text-zinc-800">
                {t("emailLabel", "Email đăng nhập Zoom của bạn")}
              </span>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="teacher@wewin.edu.vn"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-wewin-navy"
              />
              <span className="block break-words text-xs text-zinc-500">
                {isAdmin
                  ? t("listUnavailableAdmin", "Không tải được danh sách user Zoom. Thêm scope user:read:list_users:admin vào app Server-to-Server để giáo viên chọn từ danh sách.")
                  : t("listUnavailable", "Nhập email Zoom (thuộc tài khoản Zoom của trung tâm). Hệ thống sẽ kiểm tra trước khi lưu.")}
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !(account?.users ? selected : manualEmail.trim())}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t("save", "Kiểm tra & lưu")}
            </button>
            {current ? (
              <button
                type="button"
                onClick={() => setPicking(false)}
                disabled={busy}
                className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {t("cancel", "Hủy")}
              </button>
            ) : null}
          </div>
          <p className="break-words text-xs text-zinc-500">
            {t("note", "Chỉ áp dụng cho buổi học tạo mới. Buổi học đã lên lịch vẫn giữ tài khoản Zoom cũ.")}
          </p>
        </div>
      )}
    </section>
  );
}
