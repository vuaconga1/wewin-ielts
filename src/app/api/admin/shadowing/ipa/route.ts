import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import { sentenceIpa } from "@/lib/shadowing/ipa";
import { shadowingErrorResponse } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SENTENCES = 500;
const MAX_SENTENCE_CHARS = 500;

export async function POST(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;

  try {
    const body = (await request.json()) as { sentences?: unknown };
    if (!Array.isArray(body.sentences)) {
      return NextResponse.json({ error: "sentences must be an array" }, { status: 400 });
    }

    const sentences = body.sentences.slice(0, MAX_SENTENCES).map((s) =>
      typeof s === "string" ? s.trim().slice(0, MAX_SENTENCE_CHARS) : "",
    );

    const ipa = sentences.map((s) => (s ? sentenceIpa(s) : ""));
    return NextResponse.json({ ipa });
  } catch (err) {
    return shadowingErrorResponse(err, "admin/shadowing/ipa");
  }
}

