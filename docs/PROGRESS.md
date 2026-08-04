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
## Cập nhật: Tài khoản test, nền chấm, thông báo chat nội bộ & nội dung trang chủ

1. **Danh sách tài khoản ở trang đăng nhập**: Edge function `list-test-accounts` trả về user đang hoạt động (email, tên, role, chi nhánh). `src/pages/Login.tsx` hiển thị panel nhóm theo role, click là tự điền email + mật khẩu mặc định `Driveschool@2026`.
2. **Nền chấm chấm cho mọi role**: `DashboardLayout.tsx` dùng lớp `.grid-bg` giống trang chủ.
3. **Thông báo chat nội bộ**: trigger `on_internal_chat_message_insert` ghi vào `notifications`; `useRoleNav.tsx` hiện badge số tin chưa đọc; `DashboardLayout.tsx` bật toast + Web Notification realtime; `InternalChatPanel.tsx` tự đánh dấu đã đọc.
4. **Ảnh động trang chủ**: `src/components/landing/ImageSlideshow.tsx` — một "ô hình" nhiều ảnh sẽ tự đổi ảnh mỗi 2 giây. Áp dụng cho Banner, Giới thiệu, Khóa học, Dịch vụ, Thư viện ảnh.
5. **Quản lý nội dung trang chủ** (`src/pages/SuperadminSiteContent.tsx`): chia tab (Chung & Banner, Menu điều hướng, Giới thiệu, Khóa học, Dịch vụ, Hình ảnh, Tài liệu, Liên hệ), có mô tả tiếng Việt cho từng ô, nút "Lưu tất cả" nổi, và `src/components/shared/ImageSlotEditor.tsx` để upload/sắp xếp/xóa ảnh (lưu vào bucket `chat-attachments`, thư mục `site/`).
6. **Menu tùy biến**: superadmin đổi tên hoặc ẩn/hiện từng mục menu qua khóa `nav_labels` / `nav_hidden` trong `site_content`.
