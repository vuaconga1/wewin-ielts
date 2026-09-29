"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  fetchSessionMe,
  peekSessionMe,
  subscribeSessionMe,
} from "@/lib/client/session-me";

type Props = {
  title: string;
  description: string;
  importLabel: string;
  backLabel: string;
};

/**
 * Guests only get a way back to the module picker.
 * The import action is an admin screen, so it stays hidden until the
 * client session says this user can import.
 */
export function TestsModuleEmpty({
  title,
  description,
  importLabel,
  backLabel,
}: Props) {
  const [canImport, setCanImport] = useState(
    () => peekSessionMe()?.canImport ?? false,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchSessionMe().then((session) => {
      if (!cancelled) setCanImport(session.canImport);
    });
    const unsub = subscribeSessionMe(() => {
      const peek = peekSessionMe();
      if (peek) setCanImport(peek.canImport);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return (
    <EmptyState
      icon="book"
      title={title}
      description={description}
      actionHref={canImport ? "/admin/import" : "/tests"}
      actionLabel={canImport ? importLabel : backLabel}
      secondaryHref={canImport ? "/tests" : undefined}
      secondaryLabel={canImport ? backLabel : undefined}
    />
  );
}
