import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Light Edge guard for /admin pages and /api/admin APIs.
 * Cookie presence alone is not enough — layouts and route handlers call
 * getSessionUser + canAccessAdmin for role checks (ADMIN vs STUDENT).
 *
 * ALLOW_OPEN_ADMIN=true: only skips the login cookie check for guests
 * (local MVP without login). Logged-in students still reach layout/API
 * where canAccessAdmin rejects them.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const token = request.cookies.get("wewin_session")?.value;

  // Dev bypass: guest only — do not skip checks when a session cookie exists
  if (process.env.ALLOW_OPEN_ADMIN === "true" && !token) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApi) {
      return NextResponse.json(
        { error: "Unauthorized — cần đăng nhập tài khoản ADMIN" },
        { status: 401 },
      );
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    login.searchParams.set("reason", "admin");
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
