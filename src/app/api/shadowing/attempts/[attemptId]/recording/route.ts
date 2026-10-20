import { getSessionUser } from "@/lib/auth";
import { getShadowingRecording } from "@/lib/shadowing/store";
import { shadowingErrorResponse } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ attemptId: string }> };

/** Streams a private recording to its owner or to teachers/admins. */
export async function GET(_request: Request, { params }: Context) {
  try {
    const { attemptId } = await params;
    const user = await getSessionUser();
    const { body, mime } = await getShadowingRecording(attemptId, user);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(body.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return shadowingErrorResponse(err, "shadowing/recording");
  }
}
