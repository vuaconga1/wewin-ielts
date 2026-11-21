"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Eye, MessageSquare, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import type {
  FastbotsChatDetail,
  FastbotsChatListResult,
} from "@/lib/fastbots/types";

function formatVnDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  const date = d.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

function statusBadgeClass(status: string): string {
  if (status === "OPEN") return "bg-emerald-50 text-emerald-800";
  if (status === "CLOSED") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-50 text-amber-900";
}

type StatusFilter = "ALL" | "OPEN" | "CLOSED" | "UNKNOWN";
type ChannelFilter = "ALL" | "MESSENGER" | "FACEBOOK_COMMENT" | "WEB";

function channelLabel(
  channel: string | null | undefined,
  tc: (key: string, fallback?: string) => string,
): string {
  if (!channel) return "—";
  const key = channel.trim().toUpperCase();
  if (key === "MESSENGER") return tc("MESSENGER", "Messenger");
  if (key === "FACEBOOK_COMMENT") return tc("FACEBOOK_COMMENT", "Comment fanpage");
  if (key === "WEB") return tc("WEB", "Website");
  return channel;
}

export function HubFastbotsChats() {
  const { t } = useTranslations("admin");
  const ts = useTranslations("fastbotsChatStatus").t;
  const tr = useTranslations("fastbotsChatRoles").t;
  const tc = useTranslations("fastbotsChatChannels").t;
  const te = useTranslations("errors").t;

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [channel, setChannel] = useState<ChannelFilter>("ALL");
  const [data, setData] = useState<FastbotsChatListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );
  const [detail, setDetail] = useState<FastbotsChatDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncingMessenger, setSyncingMessenger] = useState(false);
  const [syncingComments, setSyncingComments] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status !== "ALL") params.set("status", status);
      if (channel !== "ALL") params.set("channel", channel);
      params.set("take", "50");
      const res = await fetch(
        `/api/admin/hub/fastbots-chats?${params.toString()}`,
        { cache: "no-store" },
      );
      const body = (await res.json().catch(() => null)) as
        | FastbotsChatListResult
        | { code?: string; error?: string }
        | null;
      if (!res.ok) {
        setError(
          friendlyError(
            (body as { code?: string } | null)?.code ||
              (body as { error?: string } | null)?.error,
            t("hubChatLoadFailed", "Không tải được Chat History Fastbots."),
            te,
          ),
        );
        setData(null);
        return;
      }
      setData(body as FastbotsChatListResult);
    } catch (err) {
      setError(
        friendlyError(
          err,
          t("hubChatLoadFailed", "Không tải được Chat History Fastbots."),
          te,
        ),
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, status, channel, t, te]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, query ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [load, query]);

  const openDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      setDetail(null);
      try {
        const res = await fetch(`/api/admin/hub/fastbots-chats/${id}`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as
          | FastbotsChatDetail
          | { code?: string }
          | null;
        if (!res.ok) {
          setError(
            friendlyError(
              (body as { code?: string } | null)?.code,
              t("hubChatDetailFailed", "Không mở được hội thoại."),
              te,
            ),
          );
          return;
        }
        setDetail(body as FastbotsChatDetail);
      } catch (err) {
        setError(
          friendlyError(
            err,
            t("hubChatDetailFailed", "Không mở được hội thoại."),
            te,
          ),
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [t, te],
  );

  const syncMessenger = useCallback(async () => {
    setSyncingMessenger(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hub/messenger-sync", {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        code?: string;
        detail?: string;
        synced?: number;
      } | null;
      if (!res.ok) {
        setError(
          friendlyError(
            body?.code,
            t(
              "hubChatMessengerSyncFailed",
              "Không đồng bộ được Messenger. Kiểm tra FACEBOOK_PAGE_ID và FACEBOOK_PAGE_ACCESS_TOKEN.",
            ),
            te,
          ),
        );
        return;
      }
      await load();
    } catch (err) {
      setError(
        friendlyError(
          err,
          t(
            "hubChatMessengerSyncFailed",
            "Không đồng bộ được Messenger. Kiểm tra FACEBOOK_PAGE_ID và FACEBOOK_PAGE_ACCESS_TOKEN.",
          ),
          te,
        ),
      );
    } finally {
      setSyncingMessenger(false);
    }
  }, [load, t, te]);

  const syncComments = useCallback(async () => {
    setSyncingComments(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hub/facebook-comments-sync", {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        code?: string;
        detail?: string;
        synced?: number;
        posts?: number;
      } | null;
      if (!res.ok) {
        setError(
          friendlyError(
            body?.code || body?.detail,
            t(
              "hubChatCommentsSyncFailed",
              "Không đồng bộ được comment fanpage. Kiểm tra token Page và quyền pages_read_engagement / pages_read_user_content.",
            ),
            te,
          ),
        );
        return;
      }
      await load();
    } catch (err) {
      setError(
        friendlyError(
          err,
          t(
            "hubChatCommentsSyncFailed",
            "Không đồng bộ được comment fanpage. Kiểm tra token Page và quyền pages_read_engagement / pages_read_user_content.",
          ),
          te,
        ),
      );
    } finally {
      setSyncingComments(false);
    }
  }, [load, t, te]);

  const dashboardUrl = data?.config.dashboardUrl || "https://app.fastbots.ai/";
  const webhookConfigured = data?.config.webhookConfigured ?? false;
  const messengerConfigured = data?.config.messengerConfigured ?? false;
  const facebookSyncBusy = syncingMessenger || syncingComments;

  return (
    <section className="relative min-w-0 rounded-xl border border-wewin-border bg-white shadow-sm">
      <header className="border-b border-wewin-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-zinc-900">
              {t("hubChatTitle", "Chat History (Fastbots)")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "hubChatHint",
                "Hội thoại đồng bộ khi Fastbots tạo/cập nhật contact (kèm tin nhắn trong payload). Thời gian UTC+7.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={facebookSyncBusy || !messengerConfigured}
              onClick={() => void syncMessenger()}
              title={
                messengerConfigured
                  ? undefined
                  : t(
                      "hubChatMessengerNotConfigured",
                      "Chưa cấu hình FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN trên server.",
                    )
              }
              className="inline-flex min-h-10 items-center rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingMessenger
                ? t("hubChatMessengerSyncing", "Đang đồng bộ Messenger…")
                : t("hubChatMessengerSync", "Đồng bộ Messenger")}
            </button>
            <button
              type="button"
              disabled={facebookSyncBusy || !messengerConfigured}
              onClick={() => void syncComments()}
              title={
                messengerConfigured
                  ? undefined
                  : t(
                      "hubChatMessengerNotConfigured",
                      "Chưa cấu hình FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN trên server.",
                    )
              }
              className="inline-flex min-h-10 items-center rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingComments
                ? t("hubChatCommentsSyncing", "Đang đồng bộ comment…")
                : t("hubChatCommentsSync", "Đồng bộ Comment")}
            </button>
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50"
            >
              {t("hubChatOpenFastbots", "Mở Fastbots")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </header>

      {!webhookConfigured && data ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 sm:px-5">
          <p className="font-semibold">
            {t(
              "hubChatWebhookPending",
              "Chưa cấu hình webhook Fastbots trên server.",
            )}
          </p>
          <p className="mt-1 break-words text-amber-900/90">
            {t(
              "hubChatWebhookHelp",
              { path: data.config.webhookPath },
              "Thêm FASTBOTS_WEBHOOK_SECRET (≥16 ký tự) vào env, rồi trong Fastbots → Contacts → Contact Settings đặt Endpoint URL: {path}?secret=<secret> (bật Active).",
            )}
          </p>
        </div>
      ) : null}

      <div className="border-b border-sky-100 bg-sky-50/70 px-4 py-2.5 text-xs text-sky-950 sm:px-5">
        {t(
          "hubChatScopeNote",
          "Widget website đồng bộ từng tin. Messenger: «Đồng bộ Messenger». Comment bài đăng fanpage: «Đồng bộ Comment» (cần token Page có pages_read_engagement).",
        )}
      </div>

      {!messengerConfigured && data ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 sm:px-5">
          <p className="font-semibold">
            {t(
              "hubChatMessengerNotConfigured",
              "Chưa cấu hình FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN trên server.",
            )}
          </p>
          <p className="mt-1 break-words text-amber-900/90">
            {t(
              "hubChatMessengerSetupHelp",
              "Tạo Facebook App → thêm Messenger → lấy Page ID + Page Access Token (kèm quyền đọc comment), ghi vào Vercel/.env rồi Redeploy. Sau đó bấm Đồng bộ Messenger / Đồng bộ Comment.",
            )}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="px-4 pt-3 sm:px-5">
          <FriendlyErrorAlert message={error.message} detail={error.detail} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-wewin-border px-4 py-3 sm:px-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            "hubChatSearchPlaceholder",
            "Tìm tên, email hoặc tin nhắn cuối",
          )}
          aria-label={t(
            "hubChatSearchPlaceholder",
            "Tìm tên, email hoặc tin nhắn cuối",
          )}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue/20"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label={t("hubChatFilterStatus", "Lọc trạng thái")}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">{t("hubChatStatusAll", "Tất cả trạng thái")}</option>
          <option value="OPEN">{ts("OPEN", "Đang mở")}</option>
          <option value="CLOSED">{ts("CLOSED", "Đã đóng")}</option>
          <option value="UNKNOWN">{ts("UNKNOWN", "Chưa rõ")}</option>
        </select>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ChannelFilter)}
          aria-label={t("hubChatFilterChannel", "Lọc kênh")}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">{t("hubChatChannelAll", "Tất cả kênh")}</option>
          <option value="MESSENGER">{tc("MESSENGER", "Messenger")}</option>
          <option value="FACEBOOK_COMMENT">
            {tc("FACEBOOK_COMMENT", "Comment fanpage")}
          </option>
          <option value="WEB">{tc("WEB", "Website")}</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("hubRefresh", "Làm mới")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">
                {t("hubChatColContact", "Liên hệ")}
              </th>
              <th className="px-3 py-2.5">
                {t("hubChatColChannel", "Kênh")}
              </th>
              <th className="px-3 py-2.5">
                {t("hubChatColLastMessage", "Tin nhắn cuối")}
              </th>
              <th className="px-3 py-2.5">
                {t("hubChatColStarted", "Bắt đầu")}
              </th>
              <th className="px-3 py-2.5">
                {t("hubChatColStatus", "Trạng thái")}
              </th>
              <th className="px-4 py-2.5 text-right">
                {t("hubChatColAction", "Thao tác")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  {t("hubLoading", "Đang tải…")}
                </td>
              </tr>
            ) : !data?.items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-lg bg-wewin-accent-blue-bg text-wewin-navy">
                    <MessageSquare className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mt-2 block">
                    {t(
                      "hubChatEmpty",
                      "Chưa có hội thoại. Contact mới/cập nhật trên Fastbots (hoặc Test webhook) sẽ hiện ở đây.",
                    )}
                  </span>
                </td>
              </tr>
            ) : (
              data.items.map((row) => {
                const { date, time } = formatVnDateTime(row.startedAt);
                return (
                  <tr
                    key={row.id}
                    className="border-t border-zinc-100 hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-2.5">
                      <div className="min-w-0">
                        <strong className="block truncate text-zinc-900">
                          {row.contactName}
                        </strong>
                        {row.contactEmail ? (
                          <span className="block truncate text-xs text-zinc-500">
                            {row.contactEmail}
                          </span>
                        ) : row.contactPhone ? (
                          <span className="block truncate text-xs text-zinc-500">
                            {row.contactPhone}
                          </span>
                        ) : (
                          <span className="block truncate text-xs text-zinc-400">
                            {row.externalId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-700">
                      <span className="inline-block rounded-full bg-wewin-accent-blue-bg px-2 py-0.5 text-[11px] font-semibold text-wewin-navy">
                        {channelLabel(row.channel, tc)}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-3 py-2.5">
                      <span className="line-clamp-2 break-words text-zinc-800">
                        {row.lastMessage || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {date}
                      {time ? (
                        <span className="block text-xs text-zinc-500">{time}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
                      >
                        {ts(row.status, row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(row.id)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-wewin-navy hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {t("hubChatView", "Xem")}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 ? (
        <footer className="border-t border-wewin-border px-4 py-3 text-xs text-zinc-500 sm:px-5">
          {t(
            "hubChatShowing",
            { shown: data.items.length, total: data.total },
            "Hiển thị {shown} / {total} hội thoại",
          )}
        </footer>
      ) : null}

      {detailLoading || detail ? (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/30 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("hubChatDetailTitle", "Chi tiết hội thoại")}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t("hubChatDetailClose", "Đóng")}
            onClick={() => setDetail(null)}
          />
          <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl sm:rounded-xl">
            <header className="flex items-start justify-between gap-3 border-b border-wewin-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-zinc-900">
                  {detail?.contactName || t("hubLoading", "Đang tải…")}
                </h3>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {[
                    detail?.channel
                      ? channelLabel(detail.channel, tc)
                      : null,
                    detail?.contactEmail,
                    detail?.contactPhone,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                aria-label={t("hubChatDetailClose", "Đóng")}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {detail?.channel === "FACEBOOK_COMMENT" &&
              detail.postContext &&
              (detail.postContext.postSnippet || detail.postContext.permalink) ? (
                <div className="rounded-lg border border-wewin-border bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                  <p className="font-semibold text-wewin-navy">
                    {t("hubChatPostContext", "Bài đăng")}
                  </p>
                  {detail.postContext.postSnippet ? (
                    <p className="mt-1 line-clamp-3 break-words">
                      {detail.postContext.postSnippet}
                    </p>
                  ) : null}
                  {detail.postContext.permalink ? (
                    <a
                      href={detail.postContext.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 font-semibold text-wewin-accent-blue hover:underline"
                    >
                      {t("hubChatPostOpen", "Mở trên Facebook")}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              ) : null}
              {detailLoading && !detail ? (
                <p className="text-sm text-zinc-500">
                  {t("hubLoading", "Đang tải…")}
                </p>
              ) : !detail?.messages.length ? (
                <p className="text-sm text-zinc-500">
                  {t(
                    "hubChatNoMessages",
                    "Chưa có tin nhắn trong payload webhook này.",
                  )}
                </p>
              ) : (
                detail.messages.map((m, idx) => {
                  const mine = m.role === "visitor";
                  const { date, time } = formatVnDateTime(m.createdAt);
                  return (
                    <div
                      key={`${idx}-${m.createdAt || ""}`}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "bg-wewin-navy text-white"
                            : "bg-zinc-100 text-zinc-900"
                        }`}
                      >
                        <p className="text-[10px] font-semibold opacity-70">
                          {tr(m.role, m.role)}
                          {m.channel ? ` · ${m.channel}` : ""}
                        </p>
                        <p className="mt-0.5 break-words whitespace-pre-wrap">
                          {m.text}
                        </p>
                        <p className="mt-1 text-[10px] opacity-60">
                          {date} {time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
