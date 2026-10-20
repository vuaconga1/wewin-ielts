import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { expiredAccessResponse } from "@/lib/auth/access-guard";
import { startDictationAttempt } from "@/lib/dictation/store";
import { dictationErrorResponse } from "@/lib/dictation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const user = await getSessionUser();
    const expired = await expiredAccessResponse(user);
    if (expired) return expired;
    const result = await startDictationAttempt({ slug, userId: user?.id ?? null });
    return NextResponse.json(result);
  } catch (err) {
    return dictationErrorResponse(err, "dictation/start");
  }
}
