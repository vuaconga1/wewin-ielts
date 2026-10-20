import { NextResponse } from "next/server";
import { canEditTests, getSessionUser } from "@/lib/auth";
import { MAX_AUDIO_BYTES, audioExtension, uploadAudioFile } from "@/lib/media/upload-audio";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "Cần đăng nhập" }, { status: 401 });
  if (!canEditTests(user)) return NextResponse.json({ message: "Bạn không có quyền thay audio" }, { status: 403 });
  const { slug } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ message: "Thiếu file audio" }, { status: 400 });
  if (file.size > MAX_AUDIO_BYTES) return NextResponse.json({ message: "Audio tối đa 32MB" }, { status: 400 });
  if (!audioExtension(file)) return NextResponse.json({ message: "Chỉ hỗ trợ MP3, M4A, WAV, OGG hoặc WebM" }, { status: 400 });
  const audioUrl = await uploadAudioFile(file, "editor", slug);
  return NextResponse.json({ audioUrl });
}
