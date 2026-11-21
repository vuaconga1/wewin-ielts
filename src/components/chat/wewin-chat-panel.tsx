"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { friendlyError } from "@/lib/ui/friendly-error";

const CHAT_ID_KEY = "wewin-fastbots-chat-id-v1";

type Bubble = {
  id: string;
  role: "visitor" | "bot";
  text: string;
};

type Props = {
  dragging?: boolean;
};

export function WewinChatPanel({ dragging }: Props) {
  const { t } = useTranslations("chatWidget");
  const te = useTranslations("errors").t;
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Bubble[]>([
    {
      id: "welcome",
      role: "bot",
      text: t(
        "welcomeMessage",
        "Xin chào! WEWIN có thể hỗ trợ tư vấn lộ trình IELTS / khóa học. Bạn cần gì ạ?",
      ),
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_ID_KEY);
      if (saved) setChatId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    const visitorId = `v-${Date.now()}`;
    setMessages((prev) => [...prev, { id: visitorId, role: "visitor", text }]);
    setSending(true);
    try {
      const res = await fetch("/api/chat/fastbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chatId }),
      });
      const body = (await res.json().catch(() => null)) as {
        chatId?: string;
        reply?: string;
        code?: string;
      } | null;
      if (!res.ok || !body?.reply || !body.chatId) {
        const friendly = friendlyError(
          body?.code,
          t("sendFailed", "Không gửi được tin nhắn. Thử lại sau."),
          te,
        );
        setError(friendly.message);
        return;
      }
      setChatId(body.chatId);
      try {
        localStorage.setItem(CHAT_ID_KEY, body.chatId);
      } catch {
        /* ignore */
      }
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: "bot", text: body.reply! },
      ]);
    } catch (err) {
      const friendly = friendlyError(
        err,
        t("sendFailed", "Không gửi được tin nhắn. Thử lại sau."),
        te,
      );
      setError(friendly.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col bg-white ${dragging ? "pointer-events-none" : ""}`}
    >
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "visitor" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                m.role === "visitor"
                  ? "bg-wewin-navy text-white"
                  : "bg-zinc-100 text-zinc-900"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending ? (
          <p className="text-xs text-zinc-500">
            {t("typing", "WEWIN đang trả lời…")}
          </p>
        ) : null}
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex shrink-0 gap-2 border-t border-wewin-border p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        noValidate
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          disabled={sending}
          placeholder={t("inputPlaceholder", "Nhập tin nhắn…")}
          aria-label={t("inputPlaceholder", "Nhập tin nhắn…")}
          className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wewin-navy text-white hover:bg-wewin-navy-hover disabled:opacity-50"
          aria-label={t("send", "Gửi")}
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
