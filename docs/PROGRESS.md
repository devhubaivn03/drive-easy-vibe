# Tiến độ tính năng

## Đa Chi nhánh (Multi-Branch) — Hoàn tất giai đoạn 1

### Database
- Bảng `branches` (name, code, address, phone, is_active).
- Cột `branch_id` được thêm vào: `profiles`, `contact_leads`, `chat_sessions`, `internal_chats`.
- Chi nhánh mặc định `"Chi nhánh chính"` (code=`main`) — toàn bộ dữ liệu cũ đã backfill.
- Hàm bảo mật `public.get_user_branch_id(uuid)`.

### RLS
- `branches`: mọi user authenticated đọc được (để hiển thị tên); chỉ superadmin ghi.
- `contact_leads`, `chat_sessions`: non-superadmin bị lọc theo `branch_id`.
- `profiles`: thêm policy `same_branch_staff_profiles_select` cho phép nhân viên/giáo viên/admin cùng chi nhánh thấy hồ sơ nhau (phục vụ chat nội bộ).
- `internal_chats`: khi tạo, cả 2 user phải cùng chi nhánh với người tạo (trừ superadmin).
- Dữ liệu liên kết qua `admin_id`/`teacher_id`/`client_id` (training_progress, exam_*, client_chats, notifications) được cách ly gián tiếp vì chuỗi quan hệ không thể vượt chi nhánh.

### Backend
- Edge function `admin-create-user`: user mới tự động kế thừa `branch_id` của người tạo; superadmin có thể truyền `branch_id` (hoặc lấy theo `admin_id`).

### Frontend
- `useAuth` load kèm object `branch` (id/name/code).
- `DashboardLayout` hiển thị logo `DriveMaster` với tên chi nhánh in nghiêng, xoay nhẹ bên dưới.
- Sidebar Superadmin có mục **Quản lý Chi nhánh**.
- Trang `/superadmin/branches` — CRUD chi nhánh (tạo/sửa/bật-tắt).

## Việc còn có thể mở rộng
- UI cho Superadmin lọc dữ liệu theo chi nhánh khi xem tổng thể (hiện tại superadmin thấy tất cả).
- Cho phép Superadmin chọn chi nhánh khi tạo Admin (hiện tại truyền `branch_id` qua form của trang tạo user — cần cập nhật form nếu muốn UI tường minh).
- Tách câu hỏi / đề thi theo chi nhánh nếu sau này cần (hiện dùng chung).
- Migrate user hiện có sang chi nhánh khác nếu muốn tách "Chi nhánh chính" ra nhiều nhánh.
---

## Giai đoạn 5 — Tiện ích test, Push thông báo & Trang chủ tuỳ biến (05/08/2026)

### 1. Danh sách tài khoản thử nghiệm ở trang đăng nhập
- `src/pages/Login.tsx`: thêm bảng bên phải liệt kê 11 tài khoản kèm badge vai trò
  (SUPERADMIN / ADMIN / GIÁO VIÊN / NHÂN VIÊN / HỌC VIÊN).
- Nhấn vào 1 thẻ → tự điền email + mật khẩu chung `Driveschool@2026`.
- Nền trang đăng nhập cũng dùng hoạ tiết chấm (`grid-bg`).

### 2. Nền chấm cho toàn bộ dashboard
- `src/components/DashboardLayout.tsx`: thêm class `grid-bg` vào khung ngoài cùng →
  tất cả role (superadmin/admin/teacher/staff/client) có nền chấm giống trang chủ.

### 3. Thông báo push cho chat nội bộ (và mọi thông báo khác)
- `DashboardLayout`: khi có bản ghi mới trong `notifications`
  - hiện toast trong app (sonner),
  - gửi **Web Notification** của trình duyệt (tự xin quyền 1 lần khi vào dashboard).
- `src/hooks/useRoleNav.tsx`: tính số cuộc chat nội bộ chưa đọc
  (`internal_chats.last_message_at` > `last_read_a/last_read_b` của mình) và hiển thị
  **badge đỏ** ở mục “Chat nội bộ” cho cả 4 role; cập nhật realtime theo bảng `internal_chats`.

### 4. Khối ảnh Trang chủ (collage) tự đổi ảnh
- `src/components/landing/RotatingImage.tsx` (mới): 1 ô ảnh, nếu có ≥2 ảnh sẽ
  **cross-fade tự động mỗi 2 giây** (mỗi ô lệch pha 300ms), có chấm chỉ số ảnh.
- `src/pages/Index.tsx`: thêm section collage 5 ô (ô đầu lớn 2x2, 4 ô nhỏ) theo bố cục
  file phác thảo `minh họa drive.png`, đặt ngay dưới Hero.
- Nội dung lấy từ khoá `hero_gallery` trong `site_content`:
  `{ title, slides: [{ caption, images: string[] }] }`.

### 5. Superadmin tuỳ biến toàn bộ trang chủ
`src/pages/SuperadminSiteContent.tsx` được sắp xếp lại cho dễ dùng:
- Thanh **“Đi nhanh tới phần cần sửa”** (11 nút) + tiêu đề được **đánh số** + ghi chú hướng dẫn.
- Mục mới **2. Menu điều hướng**: đổi tên Trang chủ / Giới thiệu / Khóa học / Dịch vụ /
  Hình ảnh / Tài liệu / Liên hệ (khoá `nav_labels`).
- Mục mới **3. Ảnh Trang chủ**: thêm/xoá ô ảnh, **upload nhiều ảnh cùng lúc** hoặc dán link
  (mỗi dòng 1 link), xem trước + xoá từng ảnh, hiển thị nhắc “≥2 ảnh sẽ tự đổi mỗi 2 giây”.
- Bổ sung ô **Tiêu đề mục Khóa học** (`courses_title`) và **Dòng chân trang** (`footer_note`).

### Khoá `site_content` mới
`nav_labels`, `hero_gallery`, `courses_title`, `footer_note`.

### Lưu trữ ảnh
Ảnh trang chủ upload vào bucket công khai `question-images` (tiền tố `site/`) —
chỉ superadmin được ghi, ai cũng xem được.
