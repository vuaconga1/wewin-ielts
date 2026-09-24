"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { useTranslations } from "@/i18n/provider";
import { clearMyRankCache } from "@/lib/client/ranking-me";
import { clearSessionMe, setSessionMe } from "@/lib/client/session-me";
import { initialsFromName } from "@/lib/dashboard-stats";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/tests";
  const reason = search.get("reason");
  const te = useTranslations("errors").t;
  const ta = useTranslations("auth").t;

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState(
    mode === "login" ? "admin@wewin.local" : "",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setPassword("");
    if (nextMode === "register") {
      setEmail("");
      setUsername("");
    } else {
      setEmail("admin@wewin.local");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        mode === "register" ? "/api/auth/register" : "/api/auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "register"
              ? { email, password, username: username || undefined }
              : { email, password, action: "login" },
          ),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        const mapped = friendlyError(
          data.error,
          mode === "register" ? ta("registerFailed") : ta("loginFailed"),
          te,
        );
        if (data.error && mapped.detail && mapped.detail !== mapped.message) {
          console.warn("[auth]", data.error);
        }
        setError(mapped);
        return;
      }
      const dest =
        data.user?.role === "ADMIN" && next.startsWith("/admin")
          ? next
          : data.user?.role === "ADMIN"
            ? "/admin/learn"
            : next.startsWith("/admin")
              ? "/tests"
              : next;
      clearMyRankCache();
      clearSessionMe();
      if (data.user) {
        setSessionMe({
          user: {
            username: data.user.username,
            fullName: data.user.fullName ?? null,
            initials: initialsFromName(
              data.user.fullName || data.user.username,
            ),
            role: data.user.role,
            avatarUrl: data.user.avatarUrl ?? null,
          },
          canImport:
            typeof data.canImport === "boolean"
              ? data.canImport
              : data.user.role === "ADMIN",
        });
      }
      router.push(dest);
      router.refresh();
    } catch (err) {
      const mapped = friendlyError(err, ta("networkError"), te);
      console.warn("[auth]", err);
      setError(mapped);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card-outline mx-auto w-full max-w-md space-y-5 p-6 sm:p-8"
    >
      <div>
        <h1 className="text-xl font-bold text-zinc-900">
          {mode === "login" ? ta("loginTitle") : ta("registerTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {mode === "login" ? ta("loginDesc") : ta("registerDesc")}
        </p>
        {reason === "admin" && mode === "login" ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {ta("adminReason")}
          </p>
        ) : null}
      </div>

      <div className="flex rounded-lg border border-zinc-200 p-0.5 text-sm">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
            mode === "login"
              ? "bg-wewin-navy text-white"
              : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {ta("login")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
            mode === "register"
              ? "bg-wewin-navy text-white"
              : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {ta("register")}
        </button>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">
          {mode === "login"
            ? ta("loginIdentifier", "Email hoặc username")
            : ta("email", "Email")}
        </span>
        <input
          type={mode === "login" ? "text" : "email"}
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete={mode === "login" ? "username" : "email"}
          placeholder={
            mode === "login"
              ? ta("loginIdentifierPlaceholder", "email hoặc username")
              : undefined
          }
        />
      </label>

      {mode === "register" ? (
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">
            {ta("displayName")}{" "}
            <span className="font-normal text-zinc-400">{ta("optional")}</span>
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={ta("usernamePlaceholder")}
            autoComplete="username"
          />
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">{ta("password")}</span>
        <input
          type="password"
          required
          minLength={mode === "register" ? 6 : undefined}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
        />
        {mode === "register" ? (
          <span className="mt-1 block text-xs text-zinc-500">
            {ta("minPassword")}
          </span>
        ) : null}
      </label>

      {error ? (
        <FriendlyErrorAlert message={error.message} detail={error.detail} />
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-wewin-navy py-2.5 text-sm font-semibold text-white shadow-sm shadow-wewin-navy/20 hover:bg-wewin-navy-hover disabled:opacity-50"
      >
        {loading
          ? mode === "register"
            ? ta("submittingRegister")
            : ta("submittingLogin")
          : mode === "register"
            ? ta("submitRegister")
            : ta("submitLogin")}
      </button>

      <p className="text-center text-xs text-zinc-500">
        {ta("defaultAdminHint")}{" "}
        <code>admin@wewin.local</code> / <code>change-me</code>
        <br />
        <Link href="/tests" className="text-wewin-navy hover:underline">
          {ta("continueAsGuest")}
        </Link>
      </p>
    </form>
  );
}
