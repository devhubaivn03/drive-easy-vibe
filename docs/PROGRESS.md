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