# Tài liệu Database

> File này mô tả toàn bộ database (Lovable Cloud / Supabase) của hệ thống
> đào tạo lái xe. Tham khảo `supabase/schema.sql` để xem schema dạng SQL.
> Mọi thay đổi schema phải đi qua `supabase/migrations/` – KHÔNG sửa trực
> tiếp database hay file `schema.sql`.

---

## 1. Sơ đồ quan hệ tổng thể

```
auth.users (Supabase)
    │ 1-1
    ▼
  profiles ──────────────┐
    │ admin_id (self FK) │
    │ teacher_id (self FK)
    │
    ├──< training_progress  (teacher_id, client_id)
    ├──< exam_results       (client_id, updated_by)
    ├──< exam_attempts      (client_id) >── exam_sets ──< exam_set_questions
    ├──< contact_leads      (assigned_to)
    ├──< chat_sessions      (claimed_by) ──< chat_messages
    ├──< client_chats       (client_id, peer_id, claimed_by)
    │       └──< client_chat_messages
    └──< notifications      (user_id)

  questions       (độc lập – ngân hàng câu hỏi gốc)
  site_content    (độc lập – key/value nội dung landing page)
```

## 2. Vai trò người dùng (`app_role`)

| Role         | Mô tả                                                            |
| ------------ | ---------------------------------------------------------------- |
| `superadmin` | Chủ hệ thống – toàn quyền mọi bảng, quản lý ngân hàng câu hỏi, nội dung landing. |
| `admin`      | Chủ trung tâm – quản lý staff/teacher/client thuộc `admin_id` của mình, nhập điểm thi. |
| `staff`      | Nhân viên trung tâm – chat khách vãng lai, chat hỗ trợ học viên, xem lead. |
| `teacher`    | Giáo viên – cập nhật tiến trình học và chat với học viên mình phụ trách (`profiles.teacher_id`). |
| `client`     | Học viên – xem hồ sơ, làm bài thi thử, xem điểm/tiến trình, chat với GV và nhân viên. |

Phân cấp: `profiles.admin_id` trỏ về admin chủ quản;
`profiles.teacher_id` trỏ về giáo viên đang phụ trách học viên.

---

## 3. Mô tả từng bảng

### 3.1 `profiles` – Hồ sơ người dùng
1-1 với `auth.users` qua khóa chính `id`.

| Cột            | Kiểu          | Ý nghĩa |
| -------------- | ------------- | ------- |
| `id`           | uuid (PK)     | = `auth.users.id` |
| `email`        | text          | Email đăng nhập |
| `full_name`    | text          | Họ và tên |
| `phone`        | text          | Số điện thoại |
| `avatar_url`   | text          | Ảnh đại diện |
| `role`         | `app_role`    | Vai trò (mặc định `client`) |
| `license_type` | `license_type`| Hạng bằng đăng ký (A1..F) |
| `admin_id`     | uuid → profiles | Admin chủ quản |
| `teacher_id`   | uuid → profiles | Giáo viên phụ trách (cho học viên) |
| `created_by`   | uuid → profiles | Người tạo tài khoản |
| `created_at` / `updated_at` | timestamptz | |

**Quyền truy cập (RLS):**
- User: xem & cập nhật hồ sơ của chính mình.
- Admin: xem & cập nhật mọi user có `admin_id = auth.uid()`.
- Superadmin: toàn quyền.

---

### 3.2 `training_progress` – Tiến trình học do giáo viên cập nhật

| Cột | Kiểu | Ý nghĩa |
| --- | ---- | ------- |
| `client_id`           | uuid → profiles | Học viên |
| `teacher_id`          | uuid → profiles | Giáo viên cập nhật |
| `theory_score`        | numeric | Điểm lý thuyết |
| `simulation_score`    | numeric | Điểm mô phỏng |
| `track_test_score`    | numeric | Điểm sa hình |
| `road_test_score`     | numeric | Điểm đường trường |
| `schedule_milestones` | jsonb | Các mốc lịch học |
| `notes`               | text  | Ghi chú |

**Quyền:** giáo viên thao tác với học viên mình phụ trách; học viên SELECT bản ghi của mình; superadmin toàn quyền.
**Trigger:** `notify_training_change` → tự tạo `notifications` cho học viên.

---

### 3.3 `exam_results` – Điểm thi tổng kết (admin/staff nhập)

| Cột | Kiểu | Ý nghĩa |
| --- | ---- | ------- |
| `client_id`         | uuid | Học viên |
| `theory_score`      | numeric | Lý thuyết |
| `simulation_score`  | numeric | Mô phỏng |
| `track_score`       | numeric | Sa hình |
| `road_score`        | numeric | Đường trường |
| `graduation_passed` | bool | Đã tốt nghiệp? |
| `notes`             | text | Ghi chú |
| `updated_by`        | uuid | Người cập nhật gần nhất |

**Quyền:** admin thao tác với học viên thuộc `admin_id` của mình; học viên SELECT bản ghi của mình; teacher SELECT học viên mình phụ trách.
**Trigger:** `notify_exam_change`.

---

### 3.4 `questions` – Ngân hàng câu hỏi gốc

| Cột | Kiểu | Ý nghĩa |
| --- | ---- | ------- |
| `question_text`  | text | Nội dung câu hỏi |
| `image_url`      | text | Ảnh minh hoạ (bucket `question-images`) |
| `answer_1..4`    | text | 4 đáp án (3,4 nullable) |
| `correct_answer` | int  | 1..4 |

**Quyền:** superadmin toàn quyền; authenticated SELECT.

---

### 3.5 `exam_sets` + `exam_set_questions` – Bộ đề thi thử

`exam_sets(id, name)` chứa danh sách bộ đề.
`exam_set_questions` là câu hỏi đóng băng vào bộ đề (tách rời `questions` gốc, có `order_index`).

**Quyền:** superadmin quản lý; authenticated SELECT.

---

### 3.6 `exam_attempts` – Lượt làm bài của học viên

| Cột | Kiểu | Ý nghĩa |
| --- | ---- | ------- |
| `client_id`           | uuid | Học viên làm bài |
| `exam_set_id`         | uuid | Bộ đề |
| `answers`             | jsonb | Đáp án đã chọn |
| `score`               | int  | Số câu đúng |
| `total_questions`     | int  | Tổng câu |
| `time_spent_seconds`  | int  | Thời gian làm |
| `submitted_at`        | timestamptz | Thời điểm nộp |

**Quyền:** client INSERT/SELECT bản ghi của mình; staff/admin/superadmin SELECT tất cả; teacher SELECT học viên mình phụ trách.

---

### 3.7 `contact_leads` – Lead liên hệ từ landing page

| Cột | Kiểu | Ý nghĩa |
| --- | ---- | ------- |
| `name` / `phone` / `content` | text | Thông tin khách điền |
| `status`       | `lead_status` | new / contacted / converted |
| `assigned_to`  | uuid → profiles | Nhân viên phụ trách |

**Quyền:** anon & authenticated INSERT (form public); staff/admin/superadmin SELECT/UPDATE.

---

### 3.8 `chat_sessions` + `chat_messages` – Chat khách vãng lai ↔ staff

Hỗ trợ trên landing page, không cần đăng nhập.

`chat_sessions`: 1 phiên gắn với `visitor_token`, có `status` (waiting/active/closed) và `claimed_by` (staff nhận phiên).
`chat_messages`: nội dung, `sender_type` (visitor | staff).

**Quyền:** anon INSERT/SELECT; staff/admin/superadmin toàn quyền.

---

### 3.9 `client_chats` + `client_chat_messages` – Chat nội bộ học viên

Mỗi học viên có **nhiều luồng** chat song song:

| `thread_type` | `peer_id` trỏ về | Mục đích |
| ------------- | ---------------- | -------- |
| `teacher`     | giáo viên đang phụ trách | Chat 1-1 với giáo viên. Khi đổi GV → tạo thread mới với GV mới, giữ nguyên thread cũ. |
| `staff`       | admin chủ quản (`profiles.admin_id`) | Chat với đội nhân viên trung tâm. Nhân viên nào trả lời sẽ "nhận phiên" qua `claimed_by`. |

Cột chính của `client_chats`:

| Cột | Ý nghĩa |
| --- | ------- |
| `client_id`              | Học viên sở hữu luồng |
| `thread_type`, `peer_id` | Khoá UNIQUE cùng `client_id` |
| `claimed_by`             | Staff đang nhận phiên (cho `staff` thread) |
| `status`                 | waiting / active / closed |
| `last_message_at`        | Sắp xếp danh sách |
| `last_client_message_at` / `last_peer_message_at`     | Mốc tin nhắn từ mỗi phía |
| `last_client_read_at`    / `last_peer_read_at`        | Đã đọc đến đâu – dùng để hiển thị **chấm xanh "tin chưa đọc"** |

`client_chat_messages` có thêm `attachment_url/type/name` để gửi ảnh, video, file (bucket `chat-attachments`, public, ≤25MB).

**Quyền:** kiểm tra qua hàm `can_access_client_chat_row(client_id, thread_type, peer_id)`:
- Học viên luôn truy cập luồng của mình.
- Giáo viên chỉ truy cập luồng `teacher` mà `peer_id = auth.uid()`.
- Admin truy cập luồng `staff` mà `peer_id = auth.uid()` (chính họ).
- Staff truy cập luồng `staff` mà `peer_id = admin_id của staff đó`.
- Superadmin truy cập tất cả.

**Trigger:** `on_client_chat_message_insert` tự cập nhật các mốc thời gian, mở lại phiên đang `closed`, và tạo `notifications` cho phía nhận.

---

### 3.10 `notifications` – Thông báo trong app

| Cột | Ý nghĩa |
| --- | ------- |
| `user_id` | Người nhận |
| `message` | Nội dung |
| `is_read` | Đã đọc? |

**Quyền:** user chỉ thấy/cập nhật notification của mình.
Hiển thị ở chuông góc trên bên phải dashboard.

---

### 3.11 `site_content` – Nội dung động của landing page

Key/value JSON, do **superadmin** chỉnh sửa trong "Nội dung Trang chủ".
Các key thường dùng: `hero`, `about`, `services`, `courses`, `gallery`,
`documents`, `contact` …

**Quyền:** anon/authenticated SELECT (để landing page đọc); superadmin INSERT/UPDATE.

---

## 4. Enums

| Enum               | Giá trị |
| ------------------ | ------- |
| `app_role`         | superadmin, admin, teacher, staff, client |
| `license_type`     | A1, A2, B1, B2, C, D, E, F |
| `chat_sender_type` | visitor, staff |
| `chat_status`      | waiting, active, closed |
| `lead_status`      | new, contacted, converted |

## 5. Storage buckets

| Bucket             | Public | Mục đích |
| ------------------ | ------ | -------- |
| `question-images`  | ✅     | Ảnh minh hoạ cho câu hỏi |
| `chat-attachments` | ✅     | Ảnh / video / file đính kèm trong chat (≤25MB) |

## 6. Functions trợ giúp (SECURITY DEFINER)

| Function | Công dụng |
| -------- | --------- |
| `get_user_role(uuid)`                | Lấy `role` của user – dùng trong RLS để tránh đệ quy. |
| `get_user_admin_id(uuid)`            | Lấy `admin_id` của user – dùng để map staff → admin chủ quản. |
| `can_access_client_chat_row(...)`    | Kiểm tra quyền truy cập 1 luồng chat. |
| `update_updated_at_column()`         | Trigger generic cập nhật `updated_at`. |
| `notify_training_change()`           | Tạo notification khi tiến trình học thay đổi. |
| `notify_exam_change()`               | Tạo notification khi điểm thi thay đổi. |
| `on_client_chat_message_insert()`    | Cập nhật mốc tin nhắn + tạo notification khi có tin mới. |

---

## 7. Quy ước khi cần thay đổi database

1. Tạo file mới trong `supabase/migrations/` theo format `YYYYMMDDHHMMSS_*.sql`.
2. Với bảng mới trong schema `public`, BẮT BUỘC thứ tự: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`.
3. Sau khi migration được duyệt và chạy, cập nhật `supabase/schema.sql` và file này để giữ tài liệu đồng bộ.