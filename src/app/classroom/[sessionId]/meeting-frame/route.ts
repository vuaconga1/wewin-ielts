import { getSessionUser } from "@/lib/auth";
import { getClassroomAccess } from "@/lib/classroom/access";
import { getTranslations } from "@/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ sessionId: string }> };

const ZOOM_VERSION = "6.5.0";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "SAMEORIGIN",
      "Permissions-Policy":
        "camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), geolocation=()",
      "Content-Security-Policy": [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'self'",
        "worker-src blob:",
        "style-src 'self' 'unsafe-inline' https://source.zoom.us https://*.zoom.us",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://source.zoom.us https://zoom.us https://*.zoom.us https://dmogdx0jrul3u.cloudfront.net blob:",
        "connect-src 'self' https://zoom.us https://*.zoom.us wss://*.zoom.us https://zoom.com https://*.zoom.com wss://*.zoom.com https://zoom.com.cn https://*.zoom.com.cn wss://*.zoom.com.cn",
        "img-src 'self' https: data: blob:",
        "media-src 'self' https: blob:",
        "font-src 'self' https: data:",
      ].join("; "),
    },
  });
}

export async function GET(_request: Request, context: Context) {
  const { locale, t } = await getTranslations("classroom");
  const viewer = await getSessionUser();
  const { sessionId } = await context.params;
  if (!viewer) {
    const message = escapeHtml(
      t("frameLoginRequired", "Cần đăng nhập để vào lớp học."),
    );
    return htmlResponse(
      `<!doctype html><html lang="${locale}"><meta charset="utf-8"><p>${message}</p></html>`,
      401,
    );
  }
  const access = await getClassroomAccess(sessionId, viewer.id);
  if (!access) {
    return htmlResponse(
      `<!doctype html><html lang="${locale}"><meta charset="utf-8"><p>${escapeHtml(
        t("frameAccessDenied", "Bạn không có quyền vào lớp học này."),
      )}</p></html>`,
      403,
    );
  }

  const safeSessionId = JSON.stringify(sessionId).replace(/</g, "\\u003c");
  const connectingLabel = JSON.stringify(
    t("zoomConnecting", "Đang kết nối Zoom…"),
  ).replace(/</g, "\\u003c");
  const joinFailedLabel = JSON.stringify(
    t("zoomFrameFailed", "Không thể vào phòng Zoom. Vui lòng thử lại."),
  ).replace(/</g, "\\u003c");
  return htmlResponse(`<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>WEWIN Zoom Classroom</title>
  <style>
    html,body,#meetingSDKElement{width:100%;height:100%;min-height:420px;margin:0;background:#071a3d}
    #status{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;color:#fff;font:600 15px system-ui;text-align:center}
  </style>
</head>
<body>
  <div id="status"></div>
  <div id="meetingSDKElement"></div>
  <script src="https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/react.min.js"></script>
  <script src="https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/react-dom.min.js"></script>
  <script src="https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/redux.min.js"></script>
  <script src="https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/redux-thunk.min.js"></script>
  <script src="https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/react-redux.min.js"></script>
  <script src="https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/lodash.min.js"></script>
  <script src="https://source.zoom.us/zoom-meeting-embedded-${ZOOM_VERSION}.min.js"></script>
  <script>
    (async function () {
      const status = document.getElementById("status");
      status.textContent = ${connectingLabel};
      try {
        const response = await fetch("/api/classroom/sessions/" + encodeURIComponent(${safeSessionId}) + "/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          credentials: "same-origin"
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "JOIN_FAILED");
        const client = window.ZoomMtgEmbedded.createClient();
        await client.init({
          zoomAppRoot: document.getElementById("meetingSDKElement"),
          language: "vi-VN",
          patchJsMedia: true,
          leaveOnPageUnload: true,
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: { width: 720, height: 405 },
                ribbon: { width: 300, height: 168 }
              }
            }
          }
        });
        await client.join({
          sdkKey: payload.sdkKey,
          signature: payload.signature,
          meetingNumber: payload.meetingNumber,
          password: payload.password || "",
          userName: payload.userName,
          userEmail: payload.userEmail || "",
          ...(payload.zak ? { zak: payload.zak } : {})
        });
        status.remove();
        parent.postMessage({ source: "wewin-zoom", status: "joined" }, location.origin);
      } catch (error) {
        const code = error && error.message ? error.message : "JOIN_FAILED";
        status.textContent = ${joinFailedLabel};
        parent.postMessage({ source: "wewin-zoom", status: "error", code }, location.origin);
      }
    })();
  </script>
</body>
</html>`);
}
