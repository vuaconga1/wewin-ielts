"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  PlugZap,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";
import type { ZoomAccountPublic } from "@/lib/zoom/accounts";

const inputCls =
  "w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg";

type FormState = {
  name: string;
  accountId: string;
  clientId: string;
  clientSecret: string;
  sdkKey: string;
  sdkSecret: string;
  hostUserId: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  accountId: "",
  clientId: "",
  clientSecret: "",
  sdkKey: "",
  sdkSecret: "",
  hostUserId: "me",
  isDefault: false,
};

type Notice = { kind: "ok" | "error"; text: string; detail?: string } | null;

export function ZoomAccountsManager({ accounts }: { accounts: ZoomAccountPublic[] }) {
  const { t, locale } = useTranslations("zoomAdmin");
  const { t: tErrors } = useTranslations("errors");
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | "new" | null>(
    accounts.length ? null : "new",
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const dateFormatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function errorText(code: string | undefined, raw?: unknown) {
    if (code) return t(`errors.${code}`, t("errors.generic", "Không thực hiện được. Vui lòng thử lại."));
    return friendlyError(raw, t("errors.generic", "Không thực hiện được. Vui lòng thử lại."), tErrors).message;
  }

  async function call(
    key: string,
    url: string,
    method: string,
    body?: unknown,
  ): Promise<boolean> {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string; detail?: string };
      if (!res.ok) {
        setNotice({ kind: "error", text: errorText(data.code), detail: data.detail });
        return false;
      }
      return true;
    } catch (error) {
      setNotice({ kind: "error", text: errorText(undefined, error) });
      return false;
    } finally {
      setBusy(null);
    }
  }

  function startEdit(account: ZoomAccountPublic | null) {
    setNotice(null);
    if (!account) {
      setForm({ ...EMPTY_FORM, isDefault: accounts.length === 0 });
      setEditingId("new");
      return;
    }
    setForm({
      name: account.name,
      accountId: account.accountId,
      clientId: account.clientId,
      clientSecret: "",
      sdkKey: account.sdkKey,
      sdkSecret: "",
      hostUserId: account.hostUserId,
      isDefault: account.isDefault,
    });
    setEditingId(account.id);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isNew = editingId === "new";
    const payload: Record<string, unknown> = {
      name: form.name,
      accountId: form.accountId,
      clientId: form.clientId,
      sdkKey: form.sdkKey,
      hostUserId: form.hostUserId.trim() || "me",
      isDefault: form.isDefault,
    };
    if (isNew || form.clientSecret.trim()) payload.clientSecret = form.clientSecret;
    if (isNew || form.sdkSecret.trim()) payload.sdkSecret = form.sdkSecret;
    const ok = await call(
      "save",
      isNew ? "/api/admin/zoom-accounts" : `/api/admin/zoom-accounts/${editingId}`,
      isNew ? "POST" : "PATCH",
      payload,
    );
    if (!ok) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNotice({ kind: "ok", text: t("saved", "Đã lưu tài khoản Zoom.") });
    router.refresh();
  }

  async function onTest(id: string) {
    const ok = await call(`test:${id}`, `/api/admin/zoom-accounts/${id}/test`, "POST");
    if (ok) {
      setNotice({ kind: "ok", text: t("testOk", "Kết nối Zoom thành công.") });
      router.refresh();
    }
  }

  async function onDefault(id: string) {
    if (await call(`default:${id}`, `/api/admin/zoom-accounts/${id}`, "PATCH", { isDefault: true })) {
      router.refresh();
    }
  }

  async function onDelete(account: ZoomAccountPublic) {
    if (!window.confirm(t("confirmDelete", { name: account.name }, "Xóa tài khoản Zoom \"{name}\"?"))) return;
    if (await call(`delete:${account.id}`, `/api/admin/zoom-accounts/${account.id}`, "DELETE")) {
      setNotice({ kind: "ok", text: t("deleted", "Đã xóa tài khoản Zoom.") });
      router.refresh();
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    options: { type?: string; placeholder?: string; required?: boolean; hint?: string } = {},
  ) => (
    <label className="block min-w-0 space-y-1">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <input
        type={options.type ?? "text"}
        name={`zoom-${key}`}
        required={options.required}
        value={form[key] as string}
        placeholder={options.placeholder}
        // Browsers ignore "off" next to a password field and fill the WEWIN login here.
        autoComplete={options.type === "password" ? "new-password" : "off"}
        data-1p-ignore
        data-lpignore="true"
        spellCheck={false}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className={inputCls}
      />
      {options.hint ? <span className="block break-words text-xs text-zinc-500">{options.hint}</span> : null}
    </label>
  );

  const isNew = editingId === "new";

  return (
    <div className="min-w-0 space-y-5 mx-auto max-w-3xl">
      <details className="card-outline min-w-0 p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold text-wewin-navy">
          {t("guideTitle", "Hướng dẫn lấy thông tin từ Zoom Marketplace")}
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
          <li className="break-words">{t("guideStep1", "Đăng nhập marketplace.zoom.us bằng tài khoản Zoom (quyền admin/owner) → Develop → Build App.")}</li>
          <li className="break-words">{t("guideStep2", "Tạo app Server-to-Server OAuth. Thêm scopes: meeting:write:meeting:admin, meeting:update:meeting:admin, meeting:delete:meeting:admin, meeting:read:meeting:admin, user:read:zak:admin (và user:read:token:admin nếu người chủ trì không phải chủ tài khoản). Kích hoạt app rồi chép Account ID, Client ID, Client Secret.")}</li>
          <li className="break-words">{t("guideStep3", "Tạo app General app / Meeting SDK trong cùng tài khoản, bật Meeting SDK, rồi chép Client ID (SDK Key) và Client Secret (SDK Secret).")}</li>
          <li className="break-words">{t("guideStep4", "Nhập vào form bên dưới và bấm \"Kiểm tra kết nối\". Gói Zoom Basic giới hạn họp nhóm 40 phút và một người chủ trì chỉ mở được một phòng cùng lúc.")}</li>
        </ol>
      </details>

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

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {accounts.map((account) => (
          <article key={account.id} className="card-outline min-w-0 p-4 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold text-wewin-navy">{account.name}</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {account.lastVerifiedAt
                    ? t(
                        "verifiedAt",
                        { time: dateFormatter.format(new Date(account.lastVerifiedAt)) },
                        "Kiểm tra lần cuối: {time}",
                      )
                    : t("notVerified", "Chưa kiểm tra kết nối")}
                </p>
              </div>
              {account.isDefault ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-wewin-navy px-2.5 py-1 text-xs font-semibold text-white">
                  <Star className="h-3 w-3" aria-hidden />
                  {t("defaultBadge", "Mặc định")}
                </span>
              ) : null}
            </div>
            <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-zinc-500">{t("fieldAccountId", "Account ID")}</dt>
              <dd className="min-w-0 break-all font-mono text-xs text-zinc-800">{account.accountId}</dd>
              <dt className="text-zinc-500">{t("fieldClientId", "Client ID")}</dt>
              <dd className="min-w-0 break-all font-mono text-xs text-zinc-800">{account.clientId}</dd>
              <dt className="text-zinc-500">{t("fieldSdkKey", "SDK Key")}</dt>
              <dd className="min-w-0 break-all font-mono text-xs text-zinc-800">{account.sdkKey}</dd>
              <dt className="text-zinc-500">{t("fieldHostUser", "Người chủ trì Zoom")}</dt>
              <dd className="min-w-0 break-all text-zinc-800">
                {account.hostUserId === "me" ? t("hostOwner", "Chủ tài khoản") : account.hostUserId}
              </dd>
              <dt className="text-zinc-500">{t("usage", "Đang dùng")}</dt>
              <dd className="min-w-0 text-zinc-800">
                {t(
                  "usageValue",
                  { classes: account.classroomCount, sessions: account.sessionCount },
                  "{classes} lớp · {sessions} buổi học",
                )}
              </dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onTest(account.id)}
                disabled={busy !== null}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
              >
                {busy === `test:${account.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                {t("test", "Kiểm tra kết nối")}
              </button>
              {!account.isDefault ? (
                <button
                  type="button"
                  onClick={() => void onDefault(account.id)}
                  disabled={busy !== null}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                >
                  <Star className="h-4 w-4" />
                  {t("makeDefault", "Đặt mặc định")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => startEdit(account)}
                disabled={busy !== null}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                <Pencil className="h-4 w-4" />
                {t("edit", "Sửa")}
              </button>
              <button
                type="button"
                onClick={() => void onDelete(account)}
                disabled={busy !== null}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {t("delete", "Xóa")}
              </button>
            </div>
          </article>
        ))}
      </div>

      {editingId === null ? (
        <button
          type="button"
          onClick={() => startEdit(null)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          <Plus className="h-4 w-4" />
          {t("add", "Thêm tài khoản Zoom")}
        </button>
      ) : (
        <form onSubmit={onSubmit} autoComplete="off" className="card-outline min-w-0 max-w-3xl space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-wewin-navy">
              {isNew ? t("addTitle", "Thêm tài khoản Zoom") : t("editTitle", "Sửa tài khoản Zoom")}
            </h2>
            {accounts.length ? (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label={t("cancel", "Hủy")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {field("name", t("fieldName", "Tên gợi nhớ"), {
            required: true,
            placeholder: t("namePlaceholder", "VD: Zoom WEWIN cơ sở 1"),
          })}
          <fieldset className="min-w-0 space-y-3 rounded-xl border border-zinc-200 p-3 sm:p-4">
            <legend className="px-1 text-sm font-semibold text-wewin-navy">
              {t("oauthSection", "Server-to-Server OAuth app")}
            </legend>
            {field("accountId", t("fieldAccountId", "Account ID"), { required: true })}
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {field("clientId", t("fieldClientId", "Client ID"), { required: true })}
              {field("clientSecret", t("fieldClientSecret", "Client Secret"), {
                type: "password",
                required: isNew,
                placeholder: isNew ? "" : t("keepSecret", "Để trống nếu giữ nguyên"),
              })}
            </div>
            {field("hostUserId", t("fieldHostUser", "Người chủ trì Zoom"), {
              placeholder: "me",
              hint: t("hostHint", "\"me\" = chủ tài khoản. Hoặc nhập email/ID của một user Zoom trong cùng tài khoản để phòng được tạo dưới tên người đó."),
            })}
          </fieldset>
          <fieldset className="min-w-0 space-y-3 rounded-xl border border-zinc-200 p-3 sm:p-4">
            <legend className="px-1 text-sm font-semibold text-wewin-navy">
              {t("sdkSection", "Meeting SDK app")}
            </legend>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {field("sdkKey", t("fieldSdkKey", "SDK Key"), { required: true })}
              {field("sdkSecret", t("fieldSdkSecret", "SDK Secret"), {
                type: "password",
                required: isNew,
                placeholder: isNew ? "" : t("keepSecret", "Để trống nếu giữ nguyên"),
              })}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-300"
            />
            {t("fieldDefault", "Dùng làm tài khoản mặc định khi tạo phòng")}
          </label>
          <p className="break-words text-xs text-zinc-500">
            {t("secretNote", "Secret được mã hóa trước khi lưu và không bao giờ hiển thị lại.")}
          </p>
          <button
            type="submit"
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
          >
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t("save", "Lưu")}
          </button>
        </form>
      )}
    </div>
  );
}
