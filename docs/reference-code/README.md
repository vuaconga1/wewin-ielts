# BỘ SOURCE CODE THAM KHẢO (REFERENCE TEMPLATES)

Thư mục này chứa toàn bộ source code sạch, độc lập và dễ tuỳ biến của 3 thành phần chính: **Trang Đăng nhập (Login)**, **Trang chủ giới thiệu (Landing Page)**, và **Tiện ích Trợ lý AI (Chatbot FastBot)**.

---

## 📁 Danh sách tệp nguồn tham khảo

| Thành phần | Tệp tham khảo sạch | Tệp gốc trong dự án WeWIN |
| :--- | :--- | :--- |
| **1. Chatbot FastBot** | [`fastbot-chat-widget.tsx`](file:///e:/Wewin/Wewin-ielts/docs/reference-code/fastbot-chat-widget.tsx) | [`src/components/chat/wewin-chat-widget.tsx`](file:///e:/Wewin/Wewin-ielts/src/components/chat/wewin-chat-widget.tsx) |
| **2. Trang Đăng nhập** | [`login-form-reference.tsx`](file:///e:/Wewin/Wewin-ielts/docs/reference-code/login-form-reference.tsx) & [`login-page-reference.tsx`](file:///e:/Wewin/Wewin-ielts/docs/reference-code/login-page-reference.tsx) | [`src/app/login/page.tsx`](file:///e:/Wewin/Wewin-ielts/src/app/login/page.tsx) & [`src/components/auth/login-form.tsx`](file:///e:/Wewin/Wewin-ielts/src/components/auth/login-form.tsx) |
| **3. Landing Page** | [`landing-page-reference.tsx`](file:///e:/Wewin/Wewin-ielts/docs/reference-code/landing-page-reference.tsx) | [`src/app/page.tsx`](file:///e:/Wewin/Wewin-ielts/src/app/page.tsx), [`landing-header.tsx`](file:///e:/Wewin/Wewin-ielts/src/components/test-practice/landing-header.tsx), [`about-landing.tsx`](file:///e:/Wewin/Wewin-ielts/src/components/test-practice/about-landing.tsx) |

---

## 🚀 Hướng dẫn nhanh cho người khác khi lấy làm Reference

### 1. Thư viện yêu cầu (Dependencies)
Dự án đích cần cài đặt Next.js (App Router), Tailwind CSS và thư viện icon `lucide-react`:
```bash
npm install lucide-react
```

---

### 2. Tùy biến Chatbot FastBot (`fastbot-chat-widget.tsx`)
1. **Thay Bot ID**: Đăng ký hoặc lấy ID bot tại [fastbots.ai](https://fastbots.ai), thay vào biến:
   ```ts
   export const FASTBOTS_BOT_ID = "cm6t5x0pl1e32svk4sez4rwwq"; // Bot ID của bạn
   ```
2. **Thay ảnh Mascot / Avatar**: Đặt ảnh PNG nền trong suốt vào thư mục `public/` và cập nhật biến `MASCOT_SRC`.
3. **Mở chatbot từ bất kỳ nút nào trong trang web**:
   ```tsx
   import { openChatWidget } from "@/components/chat/fastbot-chat-widget";

   <button onClick={openChatWidget}>
     Tư vấn ngay với AI
   </button>
   ```
4. **Nhúng vào dự án**: Thêm `<FastBotChatWidget />` vào `src/app/layout.tsx`.

---

### 3. Tùy biến Trang Đăng nhập (`login-form-reference.tsx`)
1. **Thay đổi Endpoint API xác thực**: Trong hàm `handleSubmit`, thay URL fetch tới backend của bạn:
   - Endpoint đăng nhập: `/api/auth/login`
   - Endpoint đăng ký: `/api/auth/register`
   - Hoặc gọi trực tiếp `signIn()` của NextAuth / Supabase Auth.
2. **Đường dẫn chuyển trang sau khi đăng nhập thành công**: Đổi `window.location.href = "/dashboard"` sang đường dẫn mong muốn.

---

### 4. Tùy biến Landing Page (`landing-page-reference.tsx`)
1. **Cấu hình thông tin thương hiệu ở đầu tệp**:
   ```ts
   const BRAND_CONFIG = {
     brandName: "Tên thương hiệu của bạn",
     logoSrc: "/brand/logo.png",
     mascotSrc: "/branding/mascot.png",
     hotlines: ["0912 345 678"],
     email: "contact@yourdomain.com",
     ...
   };
   ```
2. **Cấu trúc các khối nội dung có thể bật/tắt hoặc chỉnh sửa**:
   - `HeroSection`: Tiêu đề chính, lời giới thiệu, 2 nút hành động (CTA), ảnh minh họa.
   - `StorySection`: Nêu bài toán thực tế và 3 trụ cột cá nhân hóa.
   - `AdaptiveSection`: Thẻ banner xanh đậm sang trọng giới thiệu phương pháp học tập.
   - `ExpertSection`: So sánh Chuyên gia và Công nghệ 4 kỹ năng.
   - `MissionSection`: Dòng chữ chạy ngang vô tận (CSS ticker marquee) + thẻ sứ mệnh.
   - `AchieversSection`: Bảng vàng thành tích và các con số thống kê ấn tượng.
   - `SupportFormSection`: Form đăng ký tư vấn kèm thông tin liên hệ, hotline, cơ sở.
   - `LandingFooter`: Chân trang hoàn chỉnh với liên kết đa cột và bản quyền.
