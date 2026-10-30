import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginFormReference } from "./login-form-reference";

export const metadata: Metadata = {
  title: "Đăng nhập & Đăng ký - Nền tảng Học trực tuyến",
  description: "Trang đăng nhập tài khoản học viên và quản trị viên.",
};

export default function LoginPageReference() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* Logo thương hiệu */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#001233] text-white font-extrabold text-xl shadow-lg shadow-[#001233]/20 mb-3">
          W
        </div>
        <h2 className="text-xl font-bold text-zinc-800">Cổng Học Viên & Giảng Viên</h2>
      </div>

      <div className="px-4 sm:px-0">
        <Suspense fallback={<div className="text-center text-sm text-zinc-500 py-10">Đang tải biểu mẫu...</div>}>
          <LoginFormReference />
        </Suspense>
      </div>
    </div>
  );
}
