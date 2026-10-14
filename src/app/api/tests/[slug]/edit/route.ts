import { NextResponse } from "next/server";
import { canEditTests, getSessionUser } from "@/lib/auth";
import { ParsedTestDraftSchema } from "@/lib/import/schemas";
import { persistParsedTest } from "@/lib/import/persist";
import { getTestBySlug, saveTestDraft } from "@/lib/store/test-store";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

async function editor() {
  const user = await getSessionUser();
  if (!user) return { user: null, denied: NextResponse.json({ message: "Cần đăng nhập" }, { status: 401 }) };
  if (!canEditTests(user)) return { user, denied: NextResponse.json({ message: "Bạn không có quyền chỉnh sửa đề" }, { status: 403 }) };
  return { user, denied: null };
}

export async function GET(_request: Request, { params }: Context) {
  const auth = await editor();
  if (auth.denied) return auth.denied;
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) return NextResponse.json({ message: "Không tìm thấy đề" }, { status: 404 });
  return NextResponse.json({ test }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await editor();
  if (auth.denied || !auth.user) return auth.denied!;
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = ParsedTestDraftSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Dữ liệu đề không hợp lệ", issues: parsed.error.issues }, { status: 400 });
  if (parsed.data.slug !== slug) return NextResponse.json({ message: "Không được thay đổi slug của đề" }, { status: 400 });
  await saveTestDraft(parsed.data);
  await persistParsedTest(parsed.data, [], { adminId: auth.user.id, status: "PUBLISHED" });
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
