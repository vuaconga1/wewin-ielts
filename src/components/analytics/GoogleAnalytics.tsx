"use client";

import Script from "next/script";

interface GoogleAnalyticsProps {
  gaId?: string;
}

export function GoogleAnalytics({
  gaId = process.env.NEXT_PUBLIC_GA_ID || "G-BHPHF3EMKF",
}: GoogleAnalyticsProps) {
  if (!gaId) return null;

  return (
    <>
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              send_page_view: true
            });
          `,
        }}
      />
      <Script
        id="google-analytics-tag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
    </>
  );
}
