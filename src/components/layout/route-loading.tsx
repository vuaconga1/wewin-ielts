"use client";

import { usePathname } from "next/navigation";
import type { DashboardNavKey } from "@/components/dashboard/dashboard-shell";
import { SiteShell } from "@/components/layout/site-shell";
import { PageLoadingIndicator } from "@/components/layout/page-loading";

const NAV_PREFIXES: [string, DashboardNavKey][] = [
  ["/admin/learn", "admin-learn"],
  ["/admin/dictation", "admin-dictation"],
  ["/admin/fill-blank", "admin-fill-blank"],
  ["/admin/listen-answer", "admin-listen-answer"],
  ["/admin/shadowing", "admin-shadowing"],
  ["/admin/attempts", "admin-attempts"],
  ["/admin/users", "admin-users"],
  ["/admin/reports", "admin-reports"],
  ["/admin/audit-logs", "admin-audit-logs"],
  ["/admin/classes", "admin-classes"],
  ["/admin/zoom", "admin-zoom"],
  ["/admin/import", "import"],
  ["/account/attempts", "attempts"],
  ["/learn", "learn"],
  ["/tests", "tests"],
  ["/ranking", "ranking"],
  ["/login", "login"],
];

function navKeyForPath(pathname: string): DashboardNavKey | undefined {
  if (pathname === "/") return "home";
  return NAV_PREFIXES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.[1];
}

/** Route-level fallback: same chrome as the destination page, spinner in place of content. */
export function RouteLoading() {
  const pathname = usePathname() ?? "/";

  if (pathname.startsWith("/practice/")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wewin-bg" aria-busy="true">
        <PageLoadingIndicator />
      </div>
    );
  }

  return (
    <SiteShell active={navKeyForPath(pathname)}>
      <div className="flex min-h-[55vh] items-center justify-center" aria-busy="true">
        <PageLoadingIndicator />
      </div>
    </SiteShell>
  );
}
