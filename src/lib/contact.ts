/** Official WEWIN contact channels — update here if campuses or accounts change. */
export const CONTACT = {
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

export const SOCIAL = {
  facebook: "https://www.facebook.com/winwineducation",
  /** Placeholder until the official Zalo OA link is confirmed. */
  zalo: "#",
  tiktok: "https://www.tiktok.com/@wewin.education.vn",
  youtube: "https://www.youtube.com/@WeWINEducation",
  mail: `mailto:${CONTACT.email}`,
} as const;
