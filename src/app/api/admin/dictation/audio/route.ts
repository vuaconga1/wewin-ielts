import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import { MAX_AUDIO_BYTES, audioExtension, uploadAudioFile } from "@/lib/media/upload-audio";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file", code: "MISSING_FILE" }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "File too large", code: "FILE_TOO_LARGE" }, { status: 400 });
  }
  if (!audioExtension(file)) {
    return NextResponse.json({ error: "Unsupported audio", code: "UNSUPPORTED_AUDIO" }, { status: 400 });
  }
  const audioUrl = await uploadAudioFile(file, "dictation", "dictation");
  return NextResponse.json({ audioUrl });
}
