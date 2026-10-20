import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { expiredAccessResponse } from "@/lib/auth/access-guard";
import { submitShadowingAttempt, type RecordingUpload } from "@/lib/shadowing/store";
import { shadowingErrorResponse, sniffRecording } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RECORDING_BYTES = 4 * 1024 * 1024;

type Context = { params: Promise<{ slug: string }> };

function bad(code: string, error: string) {
  return NextResponse.json({ error, code }, { status: 400 });
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required", code: "UNAUTHORIZED" }, { status: 401 });
    }
    const expired = await expiredAccessResponse(user);
    if (expired) return expired;

    const form = await request.formData().catch(() => null);
    if (!form) return bad("INVALID_BODY", "Expected multipart form data");
    const recognizedText = form.get("recognizedText");
    const sttProvider = form.get("sttProvider");
    if (typeof recognizedText !== "string" || typeof sttProvider !== "string") {
      return bad("INVALID_BODY", "Missing recognizedText or sttProvider");
    }

    let recording: RecordingUpload | null = null;
    const file = form.get("recording");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_RECORDING_BYTES) return bad("RECORDING_TOO_LARGE", "Recording too large");
      const buffer = Buffer.from(await file.arrayBuffer());
      const kind = sniffRecording(buffer);
      if (!kind) return bad("UNSUPPORTED_RECORDING", "Unsupported recording format");
      const durationMs = Number(form.get("durationMs"));
      recording = {
        buffer,
        ...kind,
        durationMs: Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : null,
      };
    }

    const result = await submitShadowingAttempt({
      slug,
      userId: user.id,
      sttProvider,
      recognizedText,
      recording,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return shadowingErrorResponse(err, "shadowing/submit");
  }
}
