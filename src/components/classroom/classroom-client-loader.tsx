"use client";

import dynamic from "next/dynamic";
import type { LiveClassroomProps } from "./live-classroom";

const LiveClassroom = dynamic(
  () => import("./live-classroom").then((module) => module.LiveClassroom),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#edf1f7]">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-200" />
      </div>
    ),
  },
);

export function ClassroomClientLoader(props: LiveClassroomProps) {
  return <LiveClassroom {...props} />;
}
