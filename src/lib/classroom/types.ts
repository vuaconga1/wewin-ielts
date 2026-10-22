import { z } from "zod";

export const slideSchema = z.object({
  id: z.string().min(1).max(100),
  imageUrl: z
    .string()
    .min(1)
    .max(2000)
    .refine(
      (value) => value.startsWith("/") || value.startsWith("https://"),
      "Slide images must use HTTPS or a same-origin path",
    ),
  alt: z.string().max(300).optional(),
});

export const slideManifestSchema = z.array(slideSchema).min(1).max(500);

export type ClassroomSlide = z.infer<typeof slideSchema>;

export const presentationModeSchema = z.enum([
  "NONE",
  "WEWIN_SLIDES",
  "ZOOM_SCREEN_SHARE",
]);

export type ClassroomPresentation = {
  id: string;
  title: string;
  slides: ClassroomSlide[];
  slideCount: number;
};

export const publicPresentationStateSchema = z.object({
  liveSessionId: z.string().min(1),
  presentationId: z.string().min(1).nullable(),
  slideIndex: z.number().int().min(0),
  version: z.number().int().min(0),
  mode: presentationModeSchema,
  updatedAt: z.string(),
});

export type PublicPresentationState = z.infer<
  typeof publicPresentationStateSchema
>;

export function parseSlideManifest(value: unknown): ClassroomSlide[] {
  const parsed = slideManifestSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function newerPresentationState(
  current: PublicPresentationState,
  candidate: unknown,
): PublicPresentationState {
  const parsed = publicPresentationStateSchema.safeParse(candidate);
  if (!parsed.success || parsed.data.liveSessionId !== current.liveSessionId) {
    return current;
  }
  return parsed.data.version > current.version ? parsed.data : current;
}
