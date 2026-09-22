"use client";

import { useEffect, useState } from "react";
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
};

const EMPTY: SessionMe = { user: null, canImport: false };

/**
 * Shared app chrome — client-hydrated session so catalog RSC pages stay
 * static/ISR (no cookies()/Prisma avatar on every soft navigation).
 */
export function SiteShell({ children, active, wide }: Props) {
  const [session, setSession] = useState<SessionMe>(
    () => peekSessionMe() ?? EMPTY,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchSessionMe().then((next) => {
      if (!cancelled) setSession(next);
    });
    const unsub = subscribeSessionMe(() => {
      const peek = peekSessionMe();
      if (peek) {
        setSession(peek);
        return;
      }
      void fetchSessionMe().then((next) => {
        if (!cancelled) setSession(next);
      });
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return (
    <DashboardShell
      active={active}
      canImport={session.canImport}
      wide={wide}
      footer={<SiteFooter />}
      user={session.user}
    >
      {children}
    </DashboardShell>
  );
}
