import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { defaultLocale, localeToHtmlLang } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { I18nProvider } from "@/i18n/provider";
import { translate } from "@/i18n/translate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Static root layout — no cookies()/headers() so catalog pages can ISR.
 * Locale is default (vi) on the server; I18nProvider bootstraps cookie on client.
 */
export const metadata: Metadata = {
  title: "Wewin IELTS",
  description: translate(getMessages(defaultLocale), "meta.siteDescription"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = defaultLocale;
  const messages = getMessages(locale);

  return (
    <html lang={localeToHtmlLang(locale)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
