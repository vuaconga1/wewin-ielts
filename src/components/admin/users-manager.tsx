"use client";

import { useCallback, useEffect, useState } from "react";
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
  password: string;
  role: AdminUserRole;
};

const emptyForm: FormState = {
  email: "",
  username: "",
  password: "",
  role: "STUDENT",
};

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

  const dateLocale = locale === "en" ? "en-US" : "vi-VN";

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
      email: user.email,
      username: user.username,
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
            email: form.email,
            username: form.username,
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
          password?: string;
        } = {
          username: form.username,
          role: form.role,
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
    if (!confirm(t("confirmDelete", { email: user.email }))) {
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

  function roleLabel(role: AdminUserRole) {
    return role === "ADMIN" ? tc("admin") : tc("student");
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
        <form
          onSubmit={onSubmit}
          className="wewin-card-3d p-4 sm:p-5"
        >
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
                {t("email")}
              </span>
              <input
                type="email"
                required={mode === "create"}
                disabled={mode === "edit" || busy}
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full min-w-0 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm disabled:bg-zinc-50"
                autoComplete="off"
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
                minLength={mode === "create" ? 6 : undefined}
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
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="border-b border-wewin-border bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-3 sm:px-4">{t("colUser")}</th>
              <th className="px-3 py-3 sm:px-4">{t("colRole")}</th>
              <th className="px-3 py-3 sm:px-4">{t("colCreated")}</th>
              <th className="px-3 py-3 text-right sm:px-4">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
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
                  colSpan={4}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = Boolean(
                  currentUserId && user.id === currentUserId,
                );
                return (
                  <tr
                    key={user.id}
                    className="border-b border-wewin-border last:border-0"
                  >
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
                            user.username.slice(0, 2).toUpperCase()
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
                            {user.email}
                          </p>
                        </div>
                      </div>
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
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-4">
                      <div className="inline-flex flex-wrap justify-end gap-1">
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
    </div>
  );
}
