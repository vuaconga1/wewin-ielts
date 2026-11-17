"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startNavProgress } from "@/lib/client/nav-progress";
import Link from "next/link";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { useTranslations } from "@/i18n/provider";
import { clearMyRankCache } from "@/lib/client/ranking-me";
import { clearSessionMe, setSessionMe } from "@/lib/client/session-me";
import { initialsFromName } from "@/lib/dashboard-stats";
import { isTeacherAdminPath } from "@/lib/auth/staff-paths";
import {
  loginBodySchema,
  registerBodySchema,
} from "@/lib/validation/auth";
import {
  VALIDATION_DEFAULTS_EN,
  VALIDATION_DEFAULTS_VI,
  formatEmailTypoMessage,
  firstIssue,
  validationSuggestion,
} from "@/lib/validation";

type Mode = "login" | "register";

type FieldErrors = {
  email?: string;
  username?: string;
  password?: string;
};

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const reason = search.get("reason");
  const te = useTranslations("errors").t;
  const ta = useTranslations("auth").t;
  const tv = useTranslations("validation").t;
  const { locale } = useTranslations();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState(
    mode === "login" ? "admin@wewin.local" : "",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  function validationMessage(code: string, suggestion?: string): string {
    if (code === "EMAIL_DOMAIN_TYPO") {
      return formatEmailTypoMessage(
        suggestion,
        locale === "en" ? "en" : "vi",
      );
    }
    const fallback =
      locale === "en"
        ? VALIDATION_DEFAULTS_EN[code] ?? VALIDATION_DEFAULTS_EN.INVALID_INPUT
        : VALIDATION_DEFAULTS_VI[code] ?? VALIDATION_DEFAULTS_VI.INVALID_INPUT;
    return tv(code, fallback);
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setFieldErrors({});
    setPassword("");
    if (nextMode === "register") {
      setEmail("");
      setUsername("");
    } else {
      setEmail("admin@wewin.local");
    }
  }

  function validateClient(): boolean {
    if (mode === "register") {
      const parsed = registerBodySchema.safeParse({
        email,
        password,
        username: username || undefined,
      });
      if (!parsed.success) {
        const issue = firstIssue(parsed.error);
        const suggestion = validationSuggestion(parsed.error);
        const msg = validationMessage(issue.code, suggestion);
        const nextErrors: FieldErrors = {};
        if (issue.path.startsWith("password")) nextErrors.password = msg;
        else if (issue.path.startsWith("username")) nextErrors.username = msg;
        else nextErrors.email = msg;
        setFieldErrors(nextErrors);
        setError({ message: msg });
        return false;
      }
    } else {
      const parsed = loginBodySchema.safeParse({
        action: "login",
        email,
        password,
      });
      if (!parsed.success) {
        const issue = firstIssue(parsed.error);
        const suggestion = validationSuggestion(parsed.error);
        const msg = validationMessage(issue.code, suggestion);
        const nextErrors: FieldErrors = {};
        if (issue.path.startsWith("password") || issue.code.startsWith("PASSWORD")) {
          nextErrors.password = msg;
        } else {
          nextErrors.email = msg;
        }
        setFieldErrors(nextErrors);
        setError({ message: msg });
        return false;
      }
    }
    setFieldErrors({});
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateClient()) return;

    setLoading(true);
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
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        suggestion?: string;
        field?: string;
        user?: {
          username: string;
          fullName?: string | null;
          role: string;
          avatarUrl?: string | null;
        };
        canImport?: boolean;
      };
      if (!res.ok) {
        if (data.code) {
          const msg = validationMessage(data.code, data.suggestion);
          const nextErrors: FieldErrors = {};
          if (data.field?.startsWith("password") || data.code.startsWith("PASSWORD")) {
            nextErrors.password = msg;
          } else if (data.field?.startsWith("username")) {
            nextErrors.username = msg;
          } else if (
            data.code.includes("EMAIL") ||
            data.code.includes("IDENTIFIER") ||
            data.code.includes("USERNAME")
          ) {
            nextErrors.email = msg;
          }
          setFieldErrors(nextErrors);
          setError({ message: msg, detail: data.error });
          return;
        }
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
            ? "/admin/classes"
            : next.startsWith("/admin")
              ? data.user?.role === "TEACHER" && isTeacherAdminPath(next)
                ? next
                : "/tests"
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
      startNavProgress();
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

  const inputClass = (hasError?: string) =>
    `mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-wewin-accent-blue-bg ${
      hasError
        ? "border-rose-400 focus:border-rose-500"
        : "border-zinc-300 focus:border-wewin-navy"
    }`;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="card-outline mx-auto w-full max-w-md space-y-5 p-6 sm:p-8"
    >
      <div>
        <h1 className="text-center text-xl font-bold text-zinc-900">
          {mode === "login" ? ta("loginTitle") : ta("registerTitle")}
        </h1>
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
          className={inputClass(fieldErrors.email)}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          autoComplete={mode === "login" ? "username" : "email"}
          placeholder={
            mode === "login"
              ? ta("loginIdentifierPlaceholder", "email hoặc username")
              : undefined
          }
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
        />
        {fieldErrors.email ? (
          <span id="auth-email-error" className="mt-1 block text-xs text-rose-600">
            {fieldErrors.email}
          </span>
        ) : null}
      </label>

      {mode === "register" ? (
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">
            {ta("displayName")}{" "}
            <span className="font-normal text-zinc-400">{ta("optional")}</span>
          </span>
          <input
            type="text"
            className={inputClass(fieldErrors.username)}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            placeholder={ta("usernamePlaceholder")}
            autoComplete="username"
            aria-invalid={Boolean(fieldErrors.username)}
          />
          {fieldErrors.username ? (
            <span className="mt-1 block text-xs text-rose-600">
              {fieldErrors.username}
            </span>
          ) : null}
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">{ta("password")}</span>
        <input
          type="password"
          className={inputClass(fieldErrors.password)}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password ? (
          <span className="mt-1 block text-xs text-rose-600">
            {fieldErrors.password}
          </span>
        ) : mode === "register" ? (
          <span className="mt-1 block text-xs text-zinc-500">
            {ta("minPassword")}
          </span>
        ) : null}
      </label>

      {error && !fieldErrors.email && !fieldErrors.password && !fieldErrors.username ? (
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
        <br />
        <Link href="/tests" className="text-wewin-navy hover:underline">
          {ta("continueAsGuest")}
        </Link>
      </p>
    </form>
  );
}
