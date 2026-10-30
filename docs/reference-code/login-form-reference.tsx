"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";

/**
 * ============================================================================
 * LOGIN & REGISTER FORM - REFERENCE TEMPLATE
 * ============================================================================
 * Tính năng chính:
 * 1. Chuyển đổi mượt mà giữa 2 tab: Đăng nhập (Login) và Đăng ký (Register)
 * 2. Hỗ trợ hiển thị lỗi trực quan (Alert)
 * 3. Ẩn/hiện mật khẩu
 * 4. Nút bấm submit trạng thái Loading
 * 5. Tuỳ biến dễ dàng endpoint API hoặc tích hợp NextAuth / Supabase / Firebase
 * ============================================================================
 */

type AuthMode = "login" | "register";

interface AuthResponse {
  success?: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
  error?: string;
  message?: string;
}

export function LoginFormReference() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chuyển đổi giữa Đăng nhập và Đăng ký
  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setErrorMessage(null);
    setPassword("");
  }

  // Xử lý gửi biểu mẫu
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      /**
       * THAY ĐỔI ĐOẠN NÀY ĐỂ KẾT NỐI VỚI BACKEND CỦA BẠN:
       * - API POST '/api/auth/login' hoặc '/api/auth/register'
       * - Hoặc signIn('credentials', { ... }) của NextAuth
       * - Hoặc supabase.auth.signInWithPassword({ ... })
       */
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? { email: emailOrUsername, password, name: fullName }
          : { usernameOrEmail: emailOrUsername, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Đăng nhập không thành công, vui lòng thử lại.");
      }

      // Xử lý thành công: điều hướng người dùng tới trang Dashboard
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
      {/* Tiêu đề & Lời chào */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-[#001233] tracking-tight">
          {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-500">
          {mode === "login"
            ? "Đăng nhập để tiếp tục hành trình học tập của bạn"
            : "Bắt đầu trải nghiệm luyện thi & học tập miễn phí ngay hôm nay"}
        </p>
      </div>

      {/* Tabs chọn Đăng nhập / Đăng ký */}
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all ${
            mode === "login"
              ? "bg-[#001233] text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập</span>
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all ${
            mode === "register"
              ? "bg-[#001233] text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Đăng ký</span>
        </button>
      </div>

      {/* Thông báo lỗi (nếu có) */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMessage}</div>
        </div>
      )}

      {/* Form nhập liệu */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Trường Họ tên (chỉ hiện khi Đăng ký) */}
        {mode === "register" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Họ và tên
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#001233] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        {/* Trường Email hoặc Tên tài khoản */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            {mode === "login" ? "Email hoặc Username" : "Địa chỉ Email"}
          </label>
          <input
            type={mode === "login" ? "text" : "email"}
            required
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder={mode === "login" ? "email@domain.com hoặc tên đăng nhập" : "email@domain.com"}
            autoComplete={mode === "login" ? "username" : "email"}
            className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#001233] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Trường Mật khẩu */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              Mật khẩu
            </label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Quên mật khẩu?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={mode === "register" ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-[#001233] focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === "register" && (
            <p className="mt-1 text-[11px] text-zinc-400">Tối thiểu từ 6 ký tự trở lên</p>
          )}
        </div>

        {/* Nút gửi biểu mẫu */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#001233] font-bold text-sm text-white shadow-md shadow-[#001233]/20 transition-all hover:bg-[#00225e] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>{mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}</span>
          )}
        </button>
      </form>

      {/* Lựa chọn phụ (Ví dụ: Tiếp tục với tư cách Khách) */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-zinc-500">
        Bạn muốn làm bài thi thử trước?{" "}
        <Link href="/tests" className="font-semibold text-blue-600 hover:underline">
          Trải nghiệm không cần đăng nhập
        </Link>
      </div>
    </div>
  );
}
