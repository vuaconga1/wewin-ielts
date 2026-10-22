import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    // Speaking practice needs getUserMedia audio. `microphone=()` blocks the
    // entire document (site settings cannot override). Allow same-origin only.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  // Light CSP: allow Next.js inline/scripts; block framing by others.
  // Avoid overly strict script-src that breaks Next hydration.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
];

const zoomMeetingFrameCsp = [
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
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
    "mammoth",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Listening audio + diagrams under public/uploads — long cache, immutable names
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Catalog / learn hub — CDN cache + SWR (pages are ISR / static chrome)
      {
        source: "/tests",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/tests/academic",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/tests/general",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/learn",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      // Zoom Meeting SDK lives only in the classroom route. Keep camera and
      // screen capture denied elsewhere on the site.
      {
        source: "/classroom/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), geolocation=()",
          },
        ],
      },
      {
        source: "/classroom/:sessionId/meeting-frame",
        headers: [
          {
            key: "Content-Security-Policy",
            value: zoomMeetingFrameCsp,
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
