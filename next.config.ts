import type { NextConfig } from "next";

/** Admin Panel (+ local) may embed this app in an iframe for SSO workspace. */
const FRAME_ANCESTORS = [
  "'self'",
  "https://admin.wewin.edu.vn",
  "https://*.wewin.edu.vn",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].join(" ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Speaking practice needs getUserMedia audio. `microphone=()` blocks the
    // entire document (site settings cannot override). Allow same-origin only.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  // Prefer CSP frame-ancestors (do not also set X-Frame-Options SAMEORIGIN —
  // that blocks Admin Panel cross-origin embeds).
  {
    key: "Content-Security-Policy",
    value: `frame-ancestors ${FRAME_ANCESTORS}; base-uri 'self'; object-src 'none'`,
  },
];

const zoomMeetingFrameCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  `frame-ancestors ${FRAME_ANCESTORS}`,
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
  // Worksheet JSON is read via dynamic paths, which file tracing can miss.
  outputFileTracingIncludes: {
    "/learn/**": ["./data/learn/worksheet*.json", "./data/learn/worksheet*/**/*.json"],
    "/classroom/**": ["./data/learn/worksheet*.json", "./data/learn/worksheet*/**/*.json"],
    "/api/**": ["./data/learn/worksheet*.json", "./data/learn/worksheet*/**/*.json"],
  },
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
