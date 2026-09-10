# Kết nối MySQL cPanel (winielts)

Prefix account trên host của bạn: **`wineduca_`**

## Bước 1 — Tạo DB trong cPanel (bạn làm tay)

Vào **MySQL Databases** (`daegu.maychu.cloud` → cPanel):

### 1. Create New Database
- Nhập: `winielts`
- → tên thật: **`wineduca_winielts`**

### 2. Add New User
- Username: ví dụ `ielts` → **`wineduca_ielts`**
- Password: tạo mật khẩu mạnh, **lưu lại**

### 3. Add User To Database
- User: `wineduca_ielts`
- Database: `wineduca_winielts`
- Privileges: **ALL PRIVILEGES** → Make Changes

### 4. (Nếu dùng từ máy local / Vercel) Remote MySQL
- cPanel → **Remote MySQL**
- Thêm host `%` (tạm) hoặc IP máy bạn / dải Vercel
- Không bật remote thì chỉ app chạy **trên cùng server** với `localhost` mới vào được

---

## Bước 2 — Điền `.env` (máy local)

Sửa `e:\Wewin\Wewin-ielts\.env` (không commit):

```env
DATABASE_HOST="localhost"
# Nếu push từ máy Windows về cPanel từ xa, dùng hostname MySQL (thường là domain host):
# DATABASE_HOST="daegu.maychu.cloud"

DATABASE_PORT="3306"
DATABASE_USER="wineduca_ielts"
DATABASE_PASSWORD="MAT_KHAU_BAN_TAO"
DATABASE_NAME="wineduca_winielts"
DATABASE_URL="mysql://wineduca_ielts:MAT_KHAU_BAN_TAO@localhost:3306/wineduca_winielts"
```

Với Remote từ PC:

```env
DATABASE_HOST="daegu.maychu.cloud"
DATABASE_URL="mysql://wineduca_ielts:MAT_KHAU@daegu.maychu.cloud:3306/wineduca_winielts"
```

---

## Bước 3 — Đưa schema lên DB

### Cách A — phpMyAdmin (khuyên dùng khi máy Windows không remote được MySQL)

1. cPanel → **phpMyAdmin** → chọn DB `wineduca_ielts`
2. tab **Import** → chọn file `prisma/cpanel-schema.sql` trong repo
3. Go / Import

File đã gồm schema + user admin. Login: `admin@wewin.local` / `change-me`

### Cách B — `prisma db push` từ máy local

Cần **Remote MySQL** (thêm `%` hoặc IP) và hostname MySQL **resolve được** (thường là IP server hoặc hostname trong cPanel, không phải URL đăng nhập cPanel).

```bash
npx prisma db push
npm run seed:admin
```

Login: `admin@wewin.local` / `change-me`

---

## Troubleshooting — Remote MySQL đã `%` mà vẫn timeout

cPanel **Remote Database Access** chỉ thêm grant MySQL (`user@%`). Nhiều host vẫn **chặn firewall port 3306** từ internet.

Kiểm tra từ máy bạn:

```powershell
Test-NetConnection daegu.maychu.cloud -Port 3306
```

Nếu `TcpTestSucceeded : False` → gửi ticket hosting (maychu.cloud):

> Đã thêm `%` trong Remote MySQL nhưng port 3306 không mở từ ngoài. Nhờ mở firewall (CSF) cho MySQL remote / TCP 3306 để app Vercel kết nối DB `wineduca_ielts`.

**Không làm được remote:** deploy app Node trên cùng server cPanel (`DATABASE_HOST=localhost`) hoặc dùng MySQL cloud (Aiven / Railway) rồi trỏ `DATABASE_*` trên Vercel.

Thêm cùng `DATABASE_*` + `DATABASE_URL` (host = domain MySQL, **không** dùng `localhost`) vào Vercel Env → Redeploy.

`ALLOW_OPEN_ADMIN=false` khi đã seed admin xong.
