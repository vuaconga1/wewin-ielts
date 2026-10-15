"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { friendlyError } from "@/lib/ui/friendly-error";
import { useTranslations } from "@/i18n/provider";
import type { AdminUserPublic, AdminUserRole } from "@/lib/admin/users";

type Props = {
  currentUserId: string | null;
};

type FormMode = "create" | "edit" | null;

type FormState = {
  email: string;
  username: string;
  fullName: string;
  classCode: string;
  password: string;
  role: AdminUserRole;
};

const emptyForm: FormState = {
  email: "",
  username: "",
  fullName: "",
  classCode: "",
  password: "",
  role: "STUDENT",
};

const PAGE_SIZE = 20;

export function UsersManager({ currentUserId }: Props) {
  const { t } = useTranslations("usersAdmin");
  const { t: tc } = useTranslations("common");
  const { t: te } = useTranslations("errors");
  const { locale } = useTranslations();

  const [users, setUsers] = useState<AdminUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState("ALL");
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDuration, setBulkDuration] = useState("1");
  const [bulkDate, setBulkDate] = useState("");

  const dateLocale = locale === "en" ? "en-US" : "vi-VN";
  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      if (accessFilter !== "ALL" && user.accessStatus !== accessFilter) return false;
      if (!needle) return true;
      return [user.username, user.email, user.fullName, user.classCode]
        .some((value) => value?.toLowerCase().includes(needle));
    });
  }, [accessFilter, query, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = (await res.json()) as {
        users?: AdminUserPublic[];
        error?: string;
      };
      if (!res.ok) {
        const mapped = friendlyError(data.error, t("loadFailed"), te);
        setError(mapped.message);
        return;
      }
      setUsers(data.users ?? []);
      setPage(1);
    } catch (e) {
      const mapped = friendlyError(e, t("networkRetry"), te);
      setError(mapped.message);
    } finally {
      setLoading(false);
    }
  }, [t, te]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setMessage(null);
  }

  function openEdit(user: AdminUserPublic) {
    setMode("edit");
    setEditingId(user.id);
    setForm({
      email: user.email ?? "",
      username: user.username,
      fullName: user.fullName ?? "",
      classCode: user.classCode ?? "",
      password: "",
      role: user.role,
    });
    setError(null);
    setMessage(null);
  }

  function closeForm() {
    setMode(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim() || null,
            username: form.username,
            fullName: form.fullName.trim() || null,
            classCode: form.classCode.trim() || null,
            password: form.password,
            role: form.role,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          const mapped = friendlyError(data.error, t("createFailed"), te);
          setError(mapped.message);
          return;
        }
        setMessage(t("created"));
        closeForm();
        await load();
      } else if (mode === "edit" && editingId) {
        const body: {
          username: string;
          role: AdminUserRole;
          fullName: string | null;
          classCode: string | null;
          password?: string;
        } = {
          username: form.username,
          role: form.role,
          fullName: form.fullName.trim() || null,
          classCode: form.classCode.trim() || null,
        };
        if (form.password.trim()) {
          body.password = form.password;
        }
        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          const mapped = friendlyError(data.error, t("updateFailed"), te);
          setError(mapped.message);
          return;
        }
        setMessage(t("updated"));
        closeForm();
        await load();
      }
    } catch (err) {
      const mapped = friendlyError(err, t("networkRetry"), te);
      setError(mapped.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(user: AdminUserPublic) {
    if (currentUserId && user.id === currentUserId) {
      setError(t("cannotDeleteSelf"));
      return;
    }
    if (
      !confirm(
        t(
          "confirmDelete",
          { name: user.username },
          `Xóa tài khoản ${user.username}? Thao tác không hoàn tác.`,
        ),
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const mapped = friendlyError(data.error, t("deleteFailed"), te);
        setError(mapped.message);
        return;
      }
      setMessage(t("deleted"));
      if (editingId === user.id) closeForm();
      await load();
    } catch (err) {
      const mapped = friendlyError(err, t("networkRetry"), te);
      setError(mapped.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateAccess(user: AdminUserPublic, access: { months?: number; days?: number; expiresAt?: string; unlimited?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể gia hạn tài khoản");
      setMessage(`Đã cập nhật thời hạn cho ${user.username}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gia hạn tài khoản");
    } finally {
      setBusy(false);
    }
  }

  async function updateBulkAccess() {
    if (!selectedIds.length) return;
    const access = bulkDuration === "7d" ? { days: 7 }
      : bulkDuration === "unlimited" ? { unlimited: true }
      : bulkDuration === "custom" ? { expiresAt: bulkDate }
      : { months: Number(bulkDuration) };
    if (bulkDuration === "custom" && !bulkDate) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds, access }),
      });
      const data = (await res.json()) as { error?: string; updated?: number };
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật hàng loạt");
      setMessage(`Đã cập nhật ${data.updated ?? selectedIds.length} tài khoản`);
      setSelectedIds([]);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể cập nhật hàng loạt");
    } finally {
      setBusy(false);
    }
  }

  function accessLabel(user: AdminUserPublic) {
    if (user.role !== "STUDENT" || user.accessPlan === "UNLIMITED" || !user.accessExpiresAt) return "Vĩnh viễn";
    const days = Math.max(0, Math.ceil((new Date(user.accessExpiresAt).getTime() - Date.now()) / 86_400_000));
    return days > 0 ? `Còn ${days} ngày` : "Đã hết hạn";
  }

  function roleLabel(role: AdminUserRole) {
    if (role === "ADMIN") return tc("admin");
    if (role === "TEACHER") return locale === "en" ? "Teacher" : "Giáo viên";
    return tc("student");
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          {loading ? t("loading") : t("count", { n: users.length })}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-wewin-navy px-4 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          <Plus className="h-4 w-4" />
          {t("addUser")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm tên, username, email hoặc lớp" className="rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm" />
        <select value={accessFilter} onChange={(event) => { setAccessFilter(event.target.value); setPage(1); }} className="rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm">
          <option value="ALL">Tất cả thời hạn</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="EXPIRING">Sắp hết hạn</option>
          <option value="EXPIRED">Đã hết hạn</option>
          <option value="UNLIMITED">Không giới hạn</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-wewin-border bg-white p-3">
        <span className="mr-auto text-sm font-semibold text-zinc-700">Đã chọn {selectedIds.length} tài khoản</span>
        <select value={bulkDuration} onChange={(event) => setBulkDuration(event.target.value)} className="rounded-lg border border-wewin-border px-3 py-2 text-sm">
          <option value="7d">Cộng 7 ngày</option><option value="1">Cộng 1 tháng</option><option value="2">Cộng 2 tháng</option><option value="3">Cộng 3 tháng</option><option value="6">Cộng 6 tháng</option><option value="12">Cộng 12 tháng</option><option value="custom">Đặt ngày cụ thể</option><option value="unlimited">Vĩnh viễn</option>
        </select>
        {bulkDuration === "custom" ? <input type="date" value={bulkDate} onChange={(event) => setBulkDate(event.target.value)} className="rounded-lg border border-wewin-border px-3 py-2 text-sm" /> : null}
        <button type="button" onClick={() => void updateBulkAccess()} disabled={busy || !selectedIds.length || (bulkDuration === "custom" && !bulkDate)} className="rounded-lg bg-wewin-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Áp dụng hàng loạt</button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {mode ? (
        <form onSubmit={onSubmit} className="wewin-card-3d p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-wewin-navy">
              {mode === "create" ? t("createTitle") : t("editTitle")}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-wewin-border p-1.5 text-zinc-500 hover:bg-zinc-50"
              aria-label={tc("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block min-w-0 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">
                {t("email", "Email")}{" "}
                <span className="font-normal text-zinc-400">
                  {t("emailOptional", "(tuỳ chọn)")}
                </span>
              </span>
              <input
                type="email"
                disabled={mode === "edit" || busy}
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm disabled:bg-zinc-50"
                autoComplete="off"
                placeholder={t("emailPlaceholder", "Có thể để trống")}
              />
            </label>

            <label className="block min-w-0 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">
                {t("username")}
              </span>
              <input
                type="text"
                required
                disabled={busy}
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm"
                autoComplete="off"
              />
            </label>

            <label className="block min-w-0 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">
                {t("fullName", "Họ tên")}
              </span>
              <input
                type="text"
                disabled={busy}
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm"
                autoComplete="off"
              />
            </label>

            <label className="block min-w-0 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">
                {t("classCode", "Lớp")}
              </span>
              <input
                type="text"
                disabled={busy}
                value={form.classCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, classCode: e.target.value }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm"
                autoComplete="off"
                placeholder="WW00016"
              />
            </label>

            <label className="block min-w-0 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">
                {mode === "create" ? t("password") : t("passwordOptional")}
              </span>
              <input
                type="password"
                required={mode === "create"}
                disabled={busy}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm"
                autoComplete="new-password"
                minLength={mode === "create" ? 3 : undefined}
              />
            </label>

            <label className="block min-w-0 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">
                {t("role")}
              </span>
              <select
                disabled={busy}
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as AdminUserRole,
                  }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm"
              >
                <option value="STUDENT">{tc("student")}</option>
                <option value="TEACHER">{locale === "en" ? "Teacher" : "Giáo viên"}</option>
                <option value="ADMIN">{tc("admin")}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-wewin-navy px-4 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "create" ? t("createSubmit") : t("saveSubmit")}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              className="rounded-full border border-wewin-border px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {tc("cancel")}
            </button>
          </div>
        </form>
      ) : null}

      <div className="wewin-card-3d overflow-x-auto">
        <table className="min-w-[1050px] w-full text-left text-sm">
          <thead className="border-b border-wewin-border bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-3">
                <input type="checkbox" aria-label="Chọn tất cả học viên trên trang" checked={pageUsers.some((user) => user.role === "STUDENT") && pageUsers.filter((user) => user.role === "STUDENT").every((user) => selectedIds.includes(user.id))} onChange={(event) => {
                  const pageIds = pageUsers.filter((user) => user.role === "STUDENT").map((user) => user.id);
                  setSelectedIds((current) => event.target.checked ? [...new Set([...current, ...pageIds])] : current.filter((id) => !pageIds.includes(id)));
                }} />
              </th>
              <th className="px-3 py-3 sm:px-4">{t("colUser")}</th>
              <th className="px-3 py-3 sm:px-4">
                {t("colFullName", "Họ tên")}
              </th>
              <th className="px-3 py-3 sm:px-4">{t("colClass", "Lớp")}</th>
              <th className="px-3 py-3 sm:px-4">{t("colRole")}</th>
              <th className="px-3 py-3 sm:px-4">Thời hạn</th>
              <th className="px-3 py-3 sm:px-4">{t("colCreated")}</th>
              <th className="px-3 py-3 text-right sm:px-4">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loading")}
                  </span>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              pageUsers.map((user) => {
                const isSelf = Boolean(
                  currentUserId && user.id === currentUserId,
                );
                return (
                  <tr
                    key={user.id}
                    className="border-b border-wewin-border last:border-0"
                  >
                    <td className="px-3 py-3">
                      {user.role === "STUDENT" ? <input type="checkbox" aria-label={`Chọn ${user.username}`} checked={selectedIds.includes(user.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} /> : null}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-wewin-accent-blue-bg text-xs font-bold text-wewin-navy">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (user.fullName || user.username)
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900">
                            {user.username}
                            {isSelf ? (
                              <span className="ml-1 font-normal text-zinc-400">
                                ({tc("you")})
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate break-all text-xs text-zinc-500">
                            {user.email ?? t("noEmail", "Không có email")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <p className="max-w-[14rem] truncate text-zinc-800">
                        {user.fullName || t("noFullName", "—")}
                      </p>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <p className="max-w-[10rem] truncate break-all text-zinc-700">
                        {user.classCode || t("noClass", "—")}
                      </p>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-wewin-navy/10 text-wewin-navy"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-600 sm:px-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${user.accessStatus === "EXPIRED" ? "bg-red-50 text-red-700" : user.accessStatus === "EXPIRING" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {accessLabel(user)}
                      </span>
                      {user.accessExpiresAt ? <p className="mt-1 text-xs">{formatDate(user.accessExpiresAt)}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-600 sm:px-4">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-4">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        {user.role === "STUDENT" ? (
                          <>
                            <button type="button" onClick={() => void updateAccess(user, { days: 7 })} disabled={busy} className="rounded-lg border border-emerald-200 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">+7 ngày</button>
                            <button type="button" onClick={() => void updateAccess(user, { months: 1 })} disabled={busy} className="rounded-lg border border-blue-200 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50">+1 tháng</button>
                            <button type="button" onClick={() => void updateAccess(user, { months: 2 })} disabled={busy} className="rounded-lg border border-blue-200 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50">+2 tháng</button>
                            <button type="button" onClick={() => void updateAccess(user, { unlimited: true })} disabled={busy} className="rounded-lg border border-violet-200 px-2 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50">Vĩnh viễn</button>
                            <input type="date" aria-label={`Ngày hết hạn của ${user.username}`} value={expiryDates[user.id] ?? ""} onChange={(event) => setExpiryDates((current) => ({ ...current, [user.id]: event.target.value }))} className="rounded-lg border border-wewin-border px-2 py-1 text-xs" />
                            <button type="button" onClick={() => expiryDates[user.id] && void updateAccess(user, { expiresAt: expiryDates[user.id] })} disabled={busy || !expiryDates[user.id]} className="rounded-lg border border-wewin-border px-2 py-1.5 text-xs font-medium disabled:opacity-40">Đặt ngày</button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-lg border border-wewin-border px-2.5 py-1.5 text-xs font-medium text-wewin-navy hover:bg-zinc-50 disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {tc("edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(user)}
                          disabled={busy || isSelf}
                          title={isSelf ? t("cannotDeleteSelf") : undefined}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {tc("delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {users.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            {t(
              "pageInfo",
              {
                from: String((safePage - 1) * PAGE_SIZE + 1),
                to: String(Math.min(safePage * PAGE_SIZE, users.length)),
                total: String(users.length),
              },
              `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, users.length)} / ${users.length}`,
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-wewin-border px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("prevPage", "Trước")}
            </button>
            <span className="text-sm font-medium text-zinc-700">
              {t(
                "pageOf",
                { page: String(safePage), total: String(totalPages) },
                `Trang ${safePage} / ${totalPages}`,
              )}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-wewin-border px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("nextPage", "Sau")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
