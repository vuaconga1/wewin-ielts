import Image from "next/image";
import Link from "next/link";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "@/i18n/server";

/** Official / screenshot contact — update if campuses change. */
const CONTACT = {
  campus1: "292B Nơ Trang Long, P.12, Bình Thạnh, TP.HCM",
  campus2: "742 Xô Viết Nghệ Tĩnh, phường Thạnh Mỹ Tây, Bình Thạnh, TP.HCM",
  hotline1: "0345 969 388",
  hotline1Tel: "+84345969388",
  hotline2: "037 866 9388",
  hotline2Tel: "+84378669388",
  email: "officemanager@wewin.edu.vn",
  website: "https://wewin.edu.vn",
  websiteLabel: "wewin.edu.vn",
} as const;

/**
 * Social URLs — Facebook / TikTok / YouTube are official WEWIN handles.
 * TODO: replace Zalo placeholder when the official OA link is confirmed.
 */
const SOCIAL = {
  facebook: "https://www.facebook.com/winwineducation",
  zalo: "#",
  tiktok: "https://www.tiktok.com/@wewin.education.vn",
  youtube: "https://www.youtube.com/@WeWINEducation",
  mail: `mailto:${CONTACT.email}`,
} as const;

function mapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function SocialIcon({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  const isPlaceholder = href === "#";
  return (
    <a
      href={href}
      target={isPlaceholder ? undefined : "_blank"}
      rel={isPlaceholder ? undefined : "noopener noreferrer"}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold ${className}`}
    >
      {children}
    </a>
  );
}

export async function SiteFooter() {
  const { t } = await getTranslations("footer");

  const cards = [
    {
      key: "campus1",
      icon: MapPin,
      label: t("campus1", "Cơ sở 1"),
      value: CONTACT.campus1,
      href: mapsSearchUrl(CONTACT.campus1),
    },
    {
      key: "hotline1",
      icon: Phone,
      label: t("hotline1", "Hotline cơ sở 1"),
      value: CONTACT.hotline1,
      href: `tel:${CONTACT.hotline1Tel}`,
    },
    {
      key: "campus2",
      icon: MapPin,
      label: t("campus2", "Cơ sở 2"),
      value: CONTACT.campus2,
      href: mapsSearchUrl(CONTACT.campus2),
    },
    {
      key: "hotline2",
      icon: Phone,
      label: t("hotline2", "Hotline cơ sở 2"),
      value: CONTACT.hotline2,
      href: `tel:${CONTACT.hotline2Tel}`,
    },
    {
      key: "email",
      icon: Mail,
      label: t("email", "Email"),
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
    },
    {
      key: "website",
      icon: Globe,
      label: t("website", "Website"),
      value: CONTACT.websiteLabel,
      href: CONTACT.website,
    },
  ];

  return (
    <footer
      id="site-footer"
      className="mt-6 border-t border-white/10 bg-wewin-navy text-white"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-6">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/brand/wewin-mark.png"
                alt={t("brandShort", "WEWIN")}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="text-base font-bold tracking-wide">
                <span className="text-wewin-gold">WEWIN</span>{" "}
                <span className="text-white">Education</span>
              </span>
            </Link>
            <p className="mt-1.5 max-w-md text-xs leading-snug text-white/85">
              {t(
                "tagline",
                "WEWIN BỨT PHÁ TIẾNG ANH – VƯƠN TẦM THẾ GIỚI",
              )}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <SocialIcon
                href={SOCIAL.zalo}
                label={t("social.zalo", "Zalo")}
                className="bg-[#0068FF]"
              >
                <span className="text-sm font-bold">Z</span>
              </SocialIcon>
              <SocialIcon
                href={SOCIAL.facebook}
                label={t("social.facebook", "Facebook")}
                className="bg-[#1877F2]"
              >
                <span className="text-sm font-bold">f</span>
              </SocialIcon>
              <SocialIcon
                href={SOCIAL.tiktok}
                label={t("social.tiktok", "TikTok")}
                className="bg-zinc-950"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.85 4.85 0 0 1-1-.15Z" />
                </svg>
              </SocialIcon>
              <SocialIcon
                href={SOCIAL.youtube}
                label={t("social.youtube", "YouTube")}
                className="bg-[#FF0000]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
                </svg>
              </SocialIcon>
              <SocialIcon
                href={SOCIAL.mail}
                label={t("social.mail", "Email")}
                className="bg-wewin-accent-blue"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </SocialIcon>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">
              {t("contactTitle", "Thông tin liên hệ")}
            </h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {cards.map((card) => {
                const Icon = card.icon;
                const inner = (
                  <>
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-wewin-gold-soft">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium leading-tight text-white/65">
                        {card.label}
                      </span>
                      <span className="mt-0.5 block break-words text-xs font-medium leading-snug text-white">
                        {card.value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={card.key}>
                    {card.href ? (
                      <a
                        href={card.href}
                        target={card.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          card.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="flex gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 transition hover:bg-white/10"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/60">
          {t("copyright", "© 2026 WeWIN Education. All rights reserved.")}
        </p>
      </div>
    </footer>
  );
}
