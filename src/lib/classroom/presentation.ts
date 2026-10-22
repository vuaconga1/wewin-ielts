import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ClassroomAccess } from "./access";
import type { PublicPresentationState } from "./types";

export class PresentationConflictError extends Error {}
export class PresentationInputError extends Error {}

function publicState(row: {
  liveSessionId: string;
  presentationId: string | null;
  slideIndex: number;
  version: number;
  mode: "NONE" | "WEWIN_SLIDES" | "ZOOM_SCREEN_SHARE";
  updatedAt: Date;
}): PublicPresentationState {
  return {
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function currentPresentationState(
  access: ClassroomAccess,
): Promise<PublicPresentationState> {
  const row = await prisma.presentationState.findUnique({
    where: { liveSessionId: access.session.id },
    select: {
      liveSessionId: true,
      presentationId: true,
      slideIndex: true,
      version: true,
      mode: true,
      updatedAt: true,
    },
  });
  if (row) return publicState(row);
  const fallback = access.session.presentationState;
  return publicState(fallback);
}

export async function updatePresentationState(input: {
  access: ClassroomAccess;
  mode: "NONE" | "WEWIN_SLIDES" | "ZOOM_SCREEN_SHARE";
  presentationId: string | null;
  slideIndex: number;
  expectedVersion: number;
}): Promise<PublicPresentationState> {
  if (!input.access.canControl) {
    throw new PresentationInputError("Only assigned teachers can control slides");
  }
  if (!Number.isInteger(input.slideIndex) || input.slideIndex < 0) {
    throw new PresentationInputError("Invalid slide index");
  }

  let presentationId = input.presentationId;
  if (input.mode === "WEWIN_SLIDES") {
    presentationId ??= input.access.session.presentations[0]?.id ?? null;
    if (!presentationId) {
      throw new PresentationInputError("No presentation is available");
    }
  }
  const presentation = presentationId
    ? input.access.session.presentations.find((item) => item.id === presentationId)
    : null;
  if (presentationId && !presentation) {
    throw new PresentationInputError("Presentation does not belong to this class");
  }
  if (presentation && input.slideIndex >= presentation.slideCount) {
    throw new PresentationInputError("Slide index is out of range");
  }

  const current = await prisma.presentationState.findUnique({
    where: { liveSessionId: input.access.session.id },
    select: { id: true, version: true },
  });
  const currentVersion = current?.version ?? 0;
  if (currentVersion !== input.expectedVersion) {
    throw new PresentationConflictError("Presentation state changed");
  }

  if (!current) {
    try {
      const created = await prisma.presentationState.create({
        data: {
          liveSessionId: input.access.session.id,
          presentationId,
          slideIndex: input.slideIndex,
          version: 1,
          mode: input.mode,
          updatedById: input.access.actor.id,
        },
        select: {
          liveSessionId: true,
          presentationId: true,
          slideIndex: true,
          version: true,
          mode: true,
          updatedAt: true,
        },
      });
      return publicState(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new PresentationConflictError("Presentation state changed");
      }
      throw error;
    }
  }

  const updated = await prisma.presentationState.updateMany({
    where: { id: current.id, version: current.version },
    data: {
      presentationId,
      slideIndex: input.slideIndex,
      mode: input.mode,
      updatedById: input.access.actor.id,
      version: { increment: 1 },
    },
  });
  if (updated.count !== 1) {
    throw new PresentationConflictError("Presentation state changed");
  }
  const row = await prisma.presentationState.findUniqueOrThrow({
    where: { id: current.id },
    select: {
      liveSessionId: true,
      presentationId: true,
      slideIndex: true,
      version: true,
      mode: true,
      updatedAt: true,
    },
  });
  return publicState(row);
}
