-- =====================================================================
-- SCHEMA TỔNG HỢP (CHỈ ĐỂ ĐỌC / THAM KHẢO)
-- =====================================================================
-- File này MÔ TẢ trạng thái hiện tại của database (tables, enums,
-- functions, RLS policies). KHÔNG chạy lại file này lên Supabase –
-- mọi thay đổi schema phải đi qua supabase/migrations/.
-- Cập nhật thủ công khi có migration mới để giữ đồng bộ.
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('superadmin','admin','teacher','staff','client');
CREATE TYPE public.chat_sender_type AS ENUM ('visitor','staff');
CREATE TYPE public.chat_status      AS ENUM ('waiting','active','closed');
CREATE TYPE public.lead_status      AS ENUM ('new','contacted','converted');
CREATE TYPE public.license_type     AS ENUM ('A1','A2','B1','B2','C','D','E','F');

-- ---------------------------------------------------------------------
-- TABLE: profiles  (hồ sơ user – 1-1 với auth.users)
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY,                 -- = auth.users.id
  email         text NOT NULL,
  full_name     text NOT NULL,
  phone         text,
  avatar_url    text,
  role          public.app_role NOT NULL DEFAULT 'client',
  license_type  public.license_type,
  admin_id      uuid REFERENCES public.profiles(id),  -- admin quản lý (cho staff/teacher/client)
  teacher_id    uuid REFERENCES public.profiles(id),  -- giáo viên phụ trách (cho client)
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: training_progress  (tiến trình học do giáo viên cập nhật)
-- ---------------------------------------------------------------------
CREATE TABLE public.training_progress (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            uuid NOT NULL REFERENCES public.profiles(id),
  teacher_id           uuid NOT NULL REFERENCES public.profiles(id),
  theory_score         numeric,
  simulation_score     numeric,
  track_test_score     numeric,
  road_test_score      numeric,
  schedule_milestones  jsonb,
  notes                text,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: exam_results  (điểm thi tổng kết do admin/staff nhập)
-- ---------------------------------------------------------------------
CREATE TABLE public.exam_results (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid NOT NULL,
  theory_score       numeric,
  simulation_score   numeric,
  track_score        numeric,
  road_score         numeric,
  graduation_passed  boolean,
  notes              text,
  updated_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: questions  (ngân hàng câu hỏi gốc – superadmin quản lý)
-- ---------------------------------------------------------------------
CREATE TABLE public.questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text   text NOT NULL,
  image_url       text,
  answer_1        text NOT NULL,
  answer_2        text NOT NULL,
  answer_3        text,
  answer_4        text,
  correct_answer  int  NOT NULL,           -- 1..4
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: exam_sets / exam_set_questions  (bộ đề thi thử)
-- ---------------------------------------------------------------------
CREATE TABLE public.exam_sets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_set_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id     uuid NOT NULL REFERENCES public.exam_sets(id) ON DELETE CASCADE,
  order_index     int  NOT NULL DEFAULT 0,
  question_text   text NOT NULL,
  image_url       text,
  answer_1        text NOT NULL,
  answer_2        text NOT NULL,
  answer_3        text,
  answer_4        text,
  correct_answer  int  NOT NULL
);

-- ---------------------------------------------------------------------
-- TABLE: exam_attempts  (mỗi lần học viên làm 1 bộ đề)
-- ---------------------------------------------------------------------
CREATE TABLE public.exam_attempts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL,
  exam_set_id         uuid NOT NULL REFERENCES public.exam_sets(id),
  answers             jsonb NOT NULL DEFAULT '{}'::jsonb,
  score               int  NOT NULL DEFAULT 0,
  total_questions     int  NOT NULL DEFAULT 0,
  time_spent_seconds  int  NOT NULL DEFAULT 0,
  submitted_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: contact_leads  (lead liên hệ từ landing page)
-- ---------------------------------------------------------------------
CREATE TABLE public.contact_leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  phone        text NOT NULL,
  content      text,
  status       public.lead_status NOT NULL DEFAULT 'new',
  assigned_to  uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: chat_sessions / chat_messages  (chat khách vãng lai ↔ staff)
-- ---------------------------------------------------------------------
CREATE TABLE public.chat_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_token  uuid NOT NULL,
  visitor_name   text,
  status         public.chat_status NOT NULL DEFAULT 'waiting',
  claimed_by     uuid REFERENCES public.profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type  public.chat_sender_type NOT NULL,
  sender_id    uuid REFERENCES public.profiles(id),
  content      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: client_chats / client_chat_messages
-- (chat nội bộ học viên ↔ giáo viên / nhân viên – nhiều luồng)
-- ---------------------------------------------------------------------
CREATE TABLE public.client_chats (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                uuid NOT NULL,
  thread_type              text NOT NULL DEFAULT 'staff',   -- 'teacher' | 'staff'
  peer_id                  uuid,                            -- teacher.id hoặc admin.id (chủ trung tâm)
  claimed_by               uuid,                            -- staff đang nhận phiên (cho thread_type='staff')
  status                   text NOT NULL DEFAULT 'waiting', -- waiting | active | closed
  last_message_at          timestamptz NOT NULL DEFAULT now(),
  last_client_message_at   timestamptz,
  last_peer_message_at     timestamptz,
  last_client_read_at      timestamptz,
  last_peer_read_at        timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now()
);
-- UNIQUE (client_id, thread_type, peer_id)

CREATE TABLE public.client_chat_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id          uuid NOT NULL REFERENCES public.client_chats(id) ON DELETE CASCADE,
  sender_id        uuid NOT NULL,
  sender_role      public.app_role NOT NULL,
  content          text NOT NULL,
  attachment_url   text,
  attachment_type  text,        -- image | video | file
  attachment_name  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: notifications  (thông báo trong app)
-- ---------------------------------------------------------------------
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TABLE: site_content  (cấu hình nội dung landing – key/value JSON)
-- ---------------------------------------------------------------------
CREATE TABLE public.site_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================================================

-- Lấy role của user (tránh đệ quy RLS khi check trong policy)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Lấy admin_id của user (staff/teacher/client → admin chủ quản)
CREATE OR REPLACE FUNCTION public.get_user_admin_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT admin_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Kiểm tra quyền truy cập 1 hàng client_chats / client_chat_messages
CREATE OR REPLACE FUNCTION public.can_access_client_chat_row(
  _client_id uuid, _thread_type text, _peer_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    auth.uid() = _client_id
    OR get_user_role(auth.uid()) = 'superadmin'
    OR (_thread_type = 'teacher'
        AND get_user_role(auth.uid()) = 'teacher'
        AND auth.uid() = _peer_id)
    OR (_thread_type = 'staff' AND (
          (get_user_role(auth.uid()) = 'admin' AND _peer_id = auth.uid())
          OR (get_user_role(auth.uid()) = 'staff'
              AND _peer_id = get_user_admin_id(auth.uid()))));
$$;

-- Trigger function: cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Trigger: tạo notification khi tiến trình học thay đổi
CREATE OR REPLACE FUNCTION public.notify_training_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND auth.uid() IS DISTINCT FROM NEW.client_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (NEW.client_id, 'Tiến trình học của bạn vừa được cập nhật');
  END IF;
  RETURN NEW;
END $$;

-- Trigger: tạo notification khi điểm thi thay đổi
CREATE OR REPLACE FUNCTION public.notify_exam_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND auth.uid() IS DISTINCT FROM NEW.client_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (NEW.client_id, 'Điểm thi của bạn vừa được cập nhật');
  END IF;
  RETURN NEW;
END $$;

-- Trigger: khi có tin nhắn client_chat_messages mới
--   - cập nhật last_message_at / last_*_message_at
--   - bật lại status nếu đang 'closed'
--   - tạo notification cho phía còn lại
CREATE OR REPLACE FUNCTION public.on_client_chat_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client_id uuid; v_claimed_by uuid;
BEGIN
  IF NEW.sender_role = 'client' THEN
    UPDATE public.client_chats
      SET last_message_at = now(), last_client_message_at = now(),
          status = CASE WHEN status='closed' THEN 'active' ELSE status END
      WHERE id = NEW.chat_id
      RETURNING client_id, claimed_by INTO v_client_id, v_claimed_by;
  ELSE
    UPDATE public.client_chats
      SET last_message_at = now(), last_peer_message_at = now(),
          status = CASE WHEN status='closed' THEN 'active' ELSE status END
      WHERE id = NEW.chat_id
      RETURNING client_id, claimed_by INTO v_client_id, v_claimed_by;
  END IF;

  IF NEW.sender_role <> 'client' AND v_client_id IS NOT NULL
     AND v_client_id <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_client_id, 'Bạn có tin nhắn mới từ trung tâm');
  END IF;

  IF NEW.sender_role = 'client' AND v_claimed_by IS NOT NULL
     AND v_claimed_by <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_claimed_by, 'Học viên vừa gửi tin nhắn mới');
  END IF;

  RETURN NEW;
END $$;

-- =====================================================================
-- ROW LEVEL SECURITY – tóm tắt (xem chi tiết trong docs/DATABASE.md)
-- =====================================================================
-- Mọi bảng public.* đều ENABLE ROW LEVEL SECURITY.
-- Quy ước policy chính:
--   profiles            : user xem/sửa hồ sơ của mình; admin xem/sửa user
--                         thuộc admin_id của mình; superadmin xem tất cả.
--   training_progress   : teacher quản lý học viên mình phụ trách;
--                         client xem bản ghi của chính mình.
--   exam_results        : admin quản lý học viên thuộc admin_id; client xem
--                         của chính mình; teacher xem học viên phụ trách.
--   exam_attempts       : client tự insert/select bản ghi của mình; staff/
--                         admin/superadmin xem tất; teacher xem học viên
--                         mình phụ trách.
--   questions / exam_sets / exam_set_questions : superadmin toàn quyền,
--                         authenticated SELECT (để client làm bài).
--   contact_leads       : anon/authenticated INSERT (form liên hệ);
--                         staff/admin/superadmin SELECT/UPDATE.
--   chat_sessions / chat_messages : anon insert+select (khách vãng lai);
--                         staff/admin/superadmin toàn quyền.
--   client_chats / client_chat_messages : dùng can_access_client_chat_row()
--                         – client của chính mình, teacher với học viên
--                         mình phụ trách, staff/admin theo admin_id.
--   notifications       : user chỉ thấy/cập nhật notification của mình.
--   site_content        : anon/authenticated SELECT; superadmin UPDATE/INSERT.
-- =====================================================================