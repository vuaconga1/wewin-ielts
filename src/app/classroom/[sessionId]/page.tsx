import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ClassroomClientLoader } from "@/components/classroom/classroom-client-loader";
import { getTranslations } from "@/i18n/server";
import { getSessionUser } from "@/lib/auth";
import { getClassroomAccess } from "@/lib/classroom/access";
import { isClassroomRealtimeConfigured } from "@/lib/classroom/realtime";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sessionId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations("classroom");
  return { title: t("metaTitle", "Zoom classroom | Wewin IELTS") };
}

export default async function LiveClassroomPage({ params }: Props) {
  const { sessionId } = await params;
  if (!sessionId) notFound();
  const viewer = await getSessionUser();
  if (!viewer) {
    redirect(
      `/login?next=${encodeURIComponent(`/classroom/${sessionId}`)}`,
    );
  }
  const access = await getClassroomAccess(sessionId, viewer.id);
  if (!access) redirect("/forbidden");

  return (
    <ClassroomClientLoader
      canControl={access.canControl}
      realtimeEnabled={isClassroomRealtimeConfigured()}
      session={{
        ...access.session,
        scheduledStart: access.session.scheduledStart.toISOString(),
        scheduledEnd: access.session.scheduledEnd?.toISOString() ?? null,
        presentationState: {
          ...access.session.presentationState,
          updatedAt: access.session.presentationState.updatedAt.toISOString(),
        },
      }}
    />
  );
}
