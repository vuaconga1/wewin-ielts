"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  DashboardShell,
  type DashboardNavKey,
} from "@/components/dashboard/dashboard-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  fetchSessionMe,
  peekSessionMe,
  subscribeSessionMe,
  type SessionMe,
} from "@/lib/client/session-me";

type Props = {
  children: React.ReactNode;
  active?: DashboardNavKey;
  /** Uncapped content width (lesson player); default is max-w-[1400px] */
  wide?: boolean;
  noFooter?: boolean;
  fitScreen?: boolean;
};

const EMPTY: SessionMe = { user: null, canImport: false };

function sessionSnapshot(): SessionMe {
  return peekSessionMe() ?? EMPTY;
}

/**
 * Shared app chrome — client-hydrated session so catalog RSC pages stay
 * static/ISR (no cookies()/Prisma avatar on every soft navigation).
 * The server snapshot stays logged-out; the cached session is applied after hydration.
 */
export function SiteShell({
  children,
  active,
  wide,
  noFooter = false,
  fitScreen = false,
}: Props) {
  const session = useSyncExternalStore(
    subscribeSessionMe,
    sessionSnapshot,
    () => EMPTY,
  );

  useEffect(() => {
    void fetchSessionMe();
  }, []);

  return (
    <DashboardShell
      active={active}
      canImport={session.canImport}
      wide={wide}
      noFooter={noFooter}
      fitScreen={fitScreen}
      footer={noFooter || fitScreen ? null : <SiteFooter />}
      user={session.user}
    >
      {children}
    </DashboardShell>
  );
}
