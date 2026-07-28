# Kế hoạch: Hệ thống Đa Chi Nhánh (Multi-Branch)

## Mục tiêu
Cho phép Superadmin tạo nhiều chi nhánh độc lập. Mỗi user chỉ thấy dữ liệu trong chi nhánh của mình. Logo hiển thị "DriveMaster {Tên chi nhánh}" sau khi đăng nhập.

## 1. Database (migration)

### Bảng mới `branches`
- `id uuid PK`
- `name text` (VD: "Ninh Thuận")
- `code text unique` (slug, optional)
- `address text`, `phone text` (tùy chọn)
- `is_active boolean default true`
- `created_at`, `updated_at`

RLS:
- Superadmin: full quyền
- Các role khác: SELECT chỉ chi nhánh của mình

### Thêm `branch_id uuid` vào các bảng dữ liệu
- `profiles` (cốt lõi — xác định chi nhánh của user)
- `contact_leads`, `client_chats`, `chat_sessions`
- `training_progress`, `exam_results`, `exam_attempts`
- `notifications`
- `internal_chats`
- (Bảng dùng chung KHÔNG gắn branch: `questions`, `exam_sets`, `exam_set_questions`, `site_content`)

### Helper functions (SECURITY DEFINER)
- `get_user_branch_id(_user_id uuid) returns uuid` — đọc branch_id từ profiles
- Sửa toàn bộ RLS liên quan: thêm điều kiện `branch_id = get_user_branch_id(auth.uid())` cho non-superadmin
- Superadmin luôn thấy tất cả (hoặc chọn chi nhánh để xem)

### Backfill
- Tạo 1 chi nhánh mặc định "Chi nhánh chính", gán tất cả user/data hiện có vào chi nhánh này

## 2. Backend / Edge Functions
- Cập nhật `admin-create-user`: tự gán `branch_id` = branch của admin tạo ra (superadmin thì chọn)
- Trigger đảm bảo user con (client, staff, teacher) có cùng branch với admin cha

## 3. Frontend

### Superadmin
- Trang mới `/superadmin/branches`: CRUD chi nhánh (tạo/sửa/kích hoạt/vô hiệu hóa)
- Sidebar Superadmin thêm mục "Quản lý Chi nhánh"
- Khi tạo Admin mới → chọn chi nhánh

### Auth & Context
- `useAuth` load kèm `branch` object (id, name) qua join
- Context expose `branch` cho toàn app

### Logo hiển thị
- `DashboardLayout.tsx`: cập nhật khu vực logo:
  ```
  🚗 DriveMaster
        Ninh Thuận   ← chữ nhỏ, italic/xéo, dưới DriveMaster
  ```
- Chỉ hiển thị tên chi nhánh khi user đã đăng nhập và có branch

### Data queries
- Không cần filter thủ công (RLS lo) — nhưng review các query dùng `.eq()` để đảm bảo không xung đột
- Danh sách user trong `InternalChatPanel`, `ClientChatPanel`: RLS tự lọc theo chi nhánh

## 4. Chi tiết kỹ thuật

```text
branches (1) ──< profiles.branch_id
                     │
                     ├──< training_progress.branch_id
                     ├──< exam_results.branch_id
                     ├──< contact_leads.branch_id
                     └──< ... (mọi bảng dữ liệu tenant-scoped)
```

Superadmin bypass RLS bằng `get_user_role(auth.uid()) = 'superadmin'` trong mỗi policy.

## 5. Files sẽ tạo/sửa
- **Migration**: 1 migration lớn (thêm bảng branches, cột branch_id, cập nhật RLS, backfill)
- **New**: `src/pages/SuperadminBranches.tsx`
- **Edit**: `src/App.tsx` (route), `src/hooks/useRoleNav.tsx` (menu), `src/hooks/useAuth.tsx` (load branch), `src/components/DashboardLayout.tsx` (logo), `supabase/functions/admin-create-user/index.ts` (branch inheritance)
- **Docs**: cập nhật `docs/DATABASE.md`, `supabase/schema.sql`

## 6. Ghi chú tiến độ
Sau khi hoàn tất sẽ tạo `docs/PROGRESS.md` (hoặc append vào) ghi lại trạng thái tính năng đa chi nhánh, các bảng đã migrate, và hướng phát triển tiếp theo.

## Lưu ý & rủi ro
- Đây là thay đổi lớn, ảnh hưởng toàn bộ RLS. Sau migration cần test lại đăng nhập từng role.
- Data hiện có sẽ được gộp vào 1 chi nhánh mặc định — không mất dữ liệu.
- Câu hỏi & đề thi dùng chung toàn hệ thống (không tách theo chi nhánh). Nếu bạn muốn tách cả câu hỏi theo chi nhánh, cho tôi biết để điều chỉnh.
