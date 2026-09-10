"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getTour, matchTourId } from "@/lib/tour/registry";
import { hasSeenTour, markTourSeen } from "@/lib/tour/storage";
import type { TourId, TourStep } from "@/lib/tour/types";
import { TourOverlay } from "@/components/tour/tour-overlay";

export type TourPrepareFn = (step: TourStep | null) => void | Promise<void>;

type TourContextValue = {
  active: boolean;
  tourId: TourId | null;
  steps: TourStep[];
  stepIndex: number;
  userKey: string;
  start: (opts?: { replay?: boolean }) => void;
  stop: (markSeen?: boolean) => void;
  next: () => void;
  prev: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

type Props = {
  userKey: string;
  onPrepareStep?: TourPrepareFn;
  children: ReactNode;
};

export function TourProvider({ userKey, onPrepareStep, children }: Props) {
  const pathname = usePathname();
  const tourId = matchTourId(pathname);
  const steps = useMemo(() => getTour(tourId)?.steps ?? [], [tourId]);

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const prepareRef = useRef(onPrepareStep);
  prepareRef.current = onPrepareStep;

  const stop = useCallback(
    (seen = true) => {
      setActive(false);
      setStepIndex(0);
      void prepareRef.current?.(null);
      if (seen && tourId) markTourSeen(userKey, tourId);
    },
    [tourId, userKey],
  );

  const start = useCallback(
    (opts?: { replay?: boolean }) => {
      if (!tourId || steps.length === 0) return;
      if (!opts?.replay && hasSeenTour(userKey, tourId)) return;
      setStepIndex(0);
      setActive(true);
    },
    [tourId, steps.length, userKey],
  );

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        queueMicrotask(() => stop(true));
        return i;
      }
      return i + 1;
    });
  }, [steps.length, stop]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Close tour on route change. Opening is manual via the header guide button only.
  useEffect(() => {
    setActive(false);
    setStepIndex(0);
    void prepareRef.current?.(null);
  }, [pathname]);

  const value = useMemo(
    () => ({
      active,
      tourId,
      steps,
      stepIndex,
      userKey,
      start,
      stop,
      next,
      prev,
    }),
    [active, tourId, steps, stepIndex, userKey, start, stop, next, prev],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay onPrepareStep={onPrepareStep} />
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}

export function useOptionalTour(): TourContextValue | null {
  return useContext(TourContext);
}
