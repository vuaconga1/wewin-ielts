"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/client/track-visit";

export function VisitTracker() {
  useEffect(() => {
    trackVisit();
  }, []);
  return null;
}
