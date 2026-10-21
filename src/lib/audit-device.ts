/** Short "Browser · OS" label from a User-Agent header, e.g. "Chrome · Windows". */
export function describeDevice(userAgent: string | null | undefined): string | null {
  const ua = userAgent?.trim();
  if (!ua) return null;

  const os =
    /iPhone/.test(ua) ? "iPhone"
    : /iPad/.test(ua) ? "iPad"
    : /Android/.test(ua) ? "Android"
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Windows/.test(ua) ? "Windows"
    : /Macintosh|Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : null;

  const browser =
    /Zalo/i.test(ua) ? "Zalo"
    : /FBAN|FBAV|FB_IAB/.test(ua) ? "Facebook"
    : /Instagram/.test(ua) ? "Instagram"
    : /coc_coc_browser/i.test(ua) ? "Cốc Cốc"
    : /Edg(e|A|iOS)?\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox|FxiOS/.test(ua) ? "Firefox"
    : /Chrome|CriOS/.test(ua) ? "Chrome"
    : /Safari/.test(ua) ? "Safari"
    : null;

  if (!os && !browser) return ua.slice(0, 60);
  return [browser, os].filter(Boolean).join(" · ");
}
