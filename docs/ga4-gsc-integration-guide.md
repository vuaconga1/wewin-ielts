# Hướng Dẫn Tích Hợp Google Analytics 4 (GA4) & Google Search Console (GSC) Cho Hệ Thống Multi-Subdomain

Tài liệu này chuẩn hóa quy trình triển khai đo lường tập trung cho **Domain chính** và **tất cả Subdomain** trên nền tảng **Next.js (App Router)** và cấu hình **DNS**. Có thể áp dụng lại cho bất kỳ dự án web nào trong tương lai.

---

## MỤC TIÊU HỆ THỐNG
1. **GA4 tập trung:** Dùng chung 1 mã đo lường `G-XXXXXXXXXX` cho website chính và mọi website con/subdomain để theo dõi toàn bộ hành trình người dùng xuyên suốt không bị đứt đoạn session.
2. **Next.js không duplicate event:** Tối ưu hóa tải mã script qua `next/script`, tự động nhận diện chuyển trang (SPA routing) và không bị ghi nhận 2 lần `page_view`.
3. **GSC hợp nhất:** Sử dụng **Tài sản Miền (Domain Property)** để tự động gom toàn bộ lượt hiển thị, click và từ khóa của cả domain chính lẫn mọi subdomain mà không cần xác minh từng cái một.

---

## PHẦN 1: GOOGLE ANALYTICS 4 (GA4)

### 1.1. Lấy mã hoặc sử dụng mã có sẵn
* **Định dạng mã:** `G-XXXXXXXXXX` (Measurement ID).
* **Lưu ý:** Lập trình viên **không nhất thiết phải sở hữu tài khoản Google quản trị GA4**, chỉ cần lấy đúng mã `G-XXXXXXXXXX` từ bộ phận quản lý/marketing để cấu hình vào code.

### 1.2. Cấu hình chống đứt phiên (Session Break) & Tự giới thiệu (Self-Referral)
*(Thực hiện 1 lần duy nhất trên tài khoản GA4)*:
1. Vào **Admin (Quản trị)** -> **Luồng dữ liệu (Data Streams)** -> Chọn luồng Web.
2. Chọn **Định cấu hình cài đặt thẻ (Configure tag settings)**:
   * **Định cấu hình miền của bạn (Configure your domains):** Thêm điều kiện `Chứa (Contains)` -> nhập tên miền gốc (ví dụ: `wewin.edu.vn`). Giúp GA4 hiểu các subdomain cùng là một thể thống nhất.
   * **Liệt kê trang web giới thiệu không mong muốn (List unwanted referrals):** Thêm tên miền gốc (`wewin.edu.vn`) để khi user chuyển từ web con sang web chính không bị tính thành một phiên truy cập mới (Referral).

---

### 1.3. Cài đặt vào Next.js (App Router)

#### Bước A: Biến môi trường
Thêm vào `.env.local` (và cấu hình biến môi trường trên Vercel/Hosting khi deploy):
```env
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

#### Bước B: Tạo Component `components/analytics/GoogleAnalytics.tsx`
Sử dụng `next/script` với cơ chế tải ngầm không chặn UI (`strategy="afterInteractive"`):

```tsx
"use client";

import Script from "next/script";

interface GoogleAnalyticsProps {
  gaId?: string;
}

export function GoogleAnalytics({
  gaId = process.env.NEXT_PUBLIC_GA_ID,
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
```

> **Tại sao không bị Duplicate Pageview khi chuyển trang?**
> GA4 có tính năng **Enhanced Measurement (Đo lường nâng cao)** mặc định bật theo dõi lịch sử trình duyệt (`history.pushState`). Khi Next.js chuyển trang, GA4 tự động bắt sự kiện. Không tự ý viết thêm `useEffect` gọi `gtag('event', 'page_view')` để tránh bị tính x2 lượt xem.

#### Bước C: Gắn vào `app/layout.tsx`
```tsx
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <GoogleAnalytics />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

### 1.4. Bộ tiện ích đo lường sự kiện (Custom Events)
Tạo file `lib/gtag.ts` để tái sử dụng ở bất kỳ nút bấm, form hay trang nào:

```typescript
// lib/gtag.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

// 1. Chuyển đổi Lead (Đăng ký form, liên hệ, tư vấn)
export function trackLeadGeneration(data?: { formName?: string; [key: string]: any }) {
  trackEvent("generate_lead", {
    form_name: data?.formName || "Tu_Van",
    page_location: typeof window !== "undefined" ? window.location.href : "",
    ...data,
  });
}

// 2. Tương tác nghiệp vụ chính (VD: Bắt đầu làm bài thi/quiz)
export function trackQuizStart(data: { quizId: string | number; quizTitle?: string; [key: string]: any }) {
  trackEvent("quiz_start", data);
}

// 3. Hoàn thành nghiệp vụ (VD: Nộp bài thi, xem kết quả)
export function trackQuizComplete(data: { quizId: string | number; score?: number; [key: string]: any }) {
  trackEvent("quiz_complete", data);
}

// 4. Bấm chuyển hướng sang website chính (Outbound link)
export function trackOutboundToMainSite(destinationUrl = "https://yourdomain.com") {
  trackEvent("click_to_main_site", {
    destination_url: destinationUrl,
    source_page: typeof window !== "undefined" ? window.location.pathname : "",
  });
}
```

---

## PHẦN 2: GOOGLE SEARCH CONSOLE (GSC) - TÀI SẢN MIỀN (DOMAIN)

### 2.1. Tại sao bắt buộc chọn "Miền" (Domain Property)?
* **Tiền tố URL (`https://...`):** Chỉ theo dõi đúng 1 URL cụ thể, bỏ sót `http`, không nhận các subdomain con.
* **Miền (Domain):** Nhận diện tất cả các giao thức (`http://`, `https://`), `www` và **toàn bộ subdomain hiện tại + tương lai** (`sub1.domain.com`, `sub2.domain.com`...).

---

### 2.2. Các bước xác minh qua DNS TXT (Mọi nhà cung cấp tên miền)

1. **Lấy mã xác minh trên Google Search Console:**
   * Truy cập: [search.google.com/search-console](https://search.google.com/search-console)
   * Nhấn **+ Thêm tài sản (+ Add Property)**.
   * Chọn ô bên trái: **Miền (Domain)**.
   * Nhập: `tenmien.com` *(lưu ý: KHÔNG nhập `https://`, `http://` hay `www`)*.
   * Sao chép chuỗi mã TXT do Google cung cấp: `google-site-verification=XXXXXXXXXXXXXXXXXXXX`.

2. **Cấu hình trên trang quản lý DNS (PA Việt Nam, Cloudflare, Mắt Bão, iNET...):**
   * Đăng nhập trang quản trị DNS của nhà cung cấp tên miền.
   * Thêm một bản ghi mới với thông số:
     | Trường | Giá trị |
     | :--- | :--- |
     | **Loại (Record Type)** | `TXT` |
     | **Tên (Host / Subdomain / Name)** | `@` *(hoặc để trống tùy hệ thống DNS)* |
     | **Giá trị (Value / Destination)** | `google-site-verification=XXXXXXXXXXXXXXXXXXXX` |
     | **TTL** | `Mặc định` hoặc `300` / `3600` |
   * Nhấn **Lưu cấu hình / Thêm bản ghi**.

3. **Hoàn tất xác minh:**
   * Quay lại Search Console, chờ 1 - 5 phút để DNS lan truyền.
   * Nhấn nút **XÁC MINH (Verify)**.
   * Khi màn hình báo **"Đã xác minh quyền sở hữu"**, tài sản chuyển sang dạng `sc-domain:tenmien.com`.

---

### 2.3. Cách xem tách riêng dữ liệu từng Subdomain trong GSC
Mặc định GSC hiển thị số liệu gộp. Khi cần lọc riêng từng subdomain:
1. Vào mục **Hiệu suất (Performance)** ở thanh bên trái.
2. Nhấn nút **+ Mới (+ New)** ở thanh lọc trên cùng.
3. Chọn **Trang (Page)** -> Chọn kiểu so khớp: **URL chứa (URLs containing)**.
4. Nhập tên subdomain cần lọc (ví dụ: `game.wewin.edu.vn`).
5. Kết quả sẽ lọc ra đúng lượt nhấp, lượt xem và từ khóa tìm kiếm của riêng subdomain đó.

---

## CHECKLIST 5 PHÚT KHI TRIỂN KHAI CHO PROJECT MỚI

- [ ] Lấy mã `G-XXXXXXXXXX` của hệ thống.
- [ ] Thêm `NEXT_PUBLIC_GA_ID` vào file `.env.local` và biến môi trường hosting.
- [ ] Copy component `GoogleAnalytics.tsx` vào thư mục `components/analytics/`.
- [ ] Khai báo `<GoogleAnalytics />` trong `app/layout.tsx`.
- [ ] Copy file tiện ích `lib/gtag.ts` và gắn vào các nút/sự kiện cần đo.
- [ ] Mở Google Search Console, thêm tài sản dạng **Miền**.
- [ ] Vào trang quản lý DNS tên miền, thêm bản ghi `TXT` với host `@`.
- [ ] Bấm xác minh trên Search Console và hoàn thành.
