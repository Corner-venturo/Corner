-- =====================================================
-- Venturo ERP - 權威性 Schema 遷移檔案 (Master Schema)
-- =====================================================
-- 日期: 2025-12-13
-- 版本: 1.0 (創世文件)
-- 目的: 記錄「旅人護照」與「旅人眼線」系統的核心資料表結構
--
-- 此檔案包含以下 8 個表格的完整定義：
-- 1. itineraries (行程總表) - ERP 核心表格，已存在
-- 2. itinerary_days (每日行程表)
-- 3. itinerary_items (行程項目表)
-- 4. customer_assigned_itineraries (客戶指派行程表)
-- 5. trip_members (旅伴成員表)
-- 6. customization_requests (客製化需求表)
-- 7. badge_definitions (徽章定義表)
-- 8. user_badges (使用者徽章持有表)
--
-- 注意: 使用 IF NOT EXISTS 語法，確保在已存在表格的資料庫上可安全執行
-- =====================================================

-- 啟用 uuid-ossp 擴展 (如果尚未啟用)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. itineraries (行程總表) - ERP 核心表格
-- ================================================
-- 注意: 此表格為 ERP 原有核心表格，通常已存在
-- 以下僅記錄 App 相關欄位，不會覆蓋現有結構

-- 確保 App 需要的欄位存在
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS erp_itinerary_id text;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS duration_days integer;

-- ================================================
-- 2. itinerary_days (每日行程表)
-- ================================================
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id text NOT NULL,
  day_number integer NOT NULL,
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 建立約束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'itinerary_days_itinerary_id_day_number_key'
  ) THEN
    ALTER TABLE public.itinerary_days ADD CONSTRAINT itinerary_days_itinerary_id_day_number_key UNIQUE (itinerary_id, day_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'itinerary_days_itinerary_id_fkey'
  ) THEN
    ALTER TABLE public.itinerary_days ADD CONSTRAINT itinerary_days_itinerary_id_fkey
      FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- ================================================
-- 3. itinerary_items (行程項目表)
-- ================================================
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_day_id uuid NOT NULL,
  item_order integer NOT NULL DEFAULT 0,
  item_type text NOT NULL,
  name text NOT NULL,
  description text,
  location text,
  latitude double precision,
  longitude double precision,
  start_time time without time zone,
  end_time time without time zone,
  duration_minutes integer,
  image_url text,
  booking_details jsonb,
  attraction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 建立約束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'itinerary_items_itinerary_day_id_fkey'
  ) THEN
    ALTER TABLE public.itinerary_items ADD CONSTRAINT itinerary_items_itinerary_day_id_fkey
      FOREIGN KEY (itinerary_day_id) REFERENCES public.itinerary_days(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'itinerary_items_attraction_id_fkey'
  ) THEN
    ALTER TABLE public.itinerary_items ADD CONSTRAINT itinerary_items_attraction_id_fkey
      FOREIGN KEY (attraction_id) REFERENCES public.attractions(id);
  END IF;
END
$$;

-- ================================================
-- 4. customer_assigned_itineraries (客戶指派行程表)
-- ================================================
CREATE TABLE IF NOT EXISTS public.customer_assigned_itineraries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id text NOT NULL,
  itinerary_id text NOT NULL,
  order_id text,
  assigned_date date NOT NULL,
  status text NOT NULL DEFAULT 'assigned'::text,
  notes text,
  workspace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 建立約束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_assigned_itineraries_customer_id_itinerary_id_assig_key'
  ) THEN
    ALTER TABLE public.customer_assigned_itineraries ADD CONSTRAINT customer_assigned_itineraries_customer_id_itinerary_id_assig_key
      UNIQUE (customer_id, itinerary_id, assigned_date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_assigned_itineraries_customer_id_fkey'
  ) THEN
    ALTER TABLE public.customer_assigned_itineraries ADD CONSTRAINT customer_assigned_itineraries_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_assigned_itineraries_itinerary_id_fkey'
  ) THEN
    ALTER TABLE public.customer_assigned_itineraries ADD CONSTRAINT customer_assigned_itineraries_itinerary_id_fkey
      FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_assigned_itineraries_order_id_fkey'
  ) THEN
    ALTER TABLE public.customer_assigned_itineraries ADD CONSTRAINT customer_assigned_itineraries_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_assigned_itineraries_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.customer_assigned_itineraries ADD CONSTRAINT customer_assigned_itineraries_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);
  END IF;
END
$$;

-- ================================================
-- 5. trip_members (旅伴成員表)
-- ================================================
-- 設計說明:
-- - customer_id: 關聯 ERP 客戶系統 (customers.id 是 text 類型)
-- - app_user_id: 預留給未來 App 使用者身份
-- - name/email/phone: 邀請時填寫的基本資訊
CREATE TABLE IF NOT EXISTS public.trip_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_itinerary_id uuid NOT NULL,
  customer_id text,
  app_user_id text,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'member'::text,
  status text NOT NULL DEFAULT 'active'::text,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 建立約束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_members_assigned_itinerary_id_customer_id_key'
  ) THEN
    ALTER TABLE public.trip_members ADD CONSTRAINT trip_members_assigned_itinerary_id_customer_id_key
      UNIQUE (assigned_itinerary_id, customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_members_assigned_itinerary_id_fkey'
  ) THEN
    ALTER TABLE public.trip_members ADD CONSTRAINT trip_members_assigned_itinerary_id_fkey
      FOREIGN KEY (assigned_itinerary_id) REFERENCES public.customer_assigned_itineraries(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_members_customer_id_fkey'
  ) THEN
    ALTER TABLE public.trip_members ADD CONSTRAINT trip_members_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_members_invited_by_fkey'
  ) THEN
    ALTER TABLE public.trip_members ADD CONSTRAINT trip_members_invited_by_fkey
      FOREIGN KEY (invited_by) REFERENCES public.customers(id);
  END IF;
END
$$;

-- ================================================
-- 6. customization_requests (客製化需求表)
-- ================================================
CREATE TABLE IF NOT EXISTS public.customization_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id text NOT NULL,
  assigned_itinerary_id uuid NOT NULL,
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text,
  response_text text,
  handled_by uuid,
  handled_at timestamptz,
  workspace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 建立約束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customization_requests_customer_id_fkey'
  ) THEN
    ALTER TABLE public.customization_requests ADD CONSTRAINT customization_requests_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customization_requests_assigned_itinerary_id_fkey'
  ) THEN
    ALTER TABLE public.customization_requests ADD CONSTRAINT customization_requests_assigned_itinerary_id_fkey
      FOREIGN KEY (assigned_itinerary_id) REFERENCES public.customer_assigned_itineraries(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customization_requests_handled_by_fkey'
  ) THEN
    ALTER TABLE public.customization_requests ADD CONSTRAINT customization_requests_handled_by_fkey
      FOREIGN KEY (handled_by) REFERENCES public.employees(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customization_requests_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.customization_requests ADD CONSTRAINT customization_requests_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);
  END IF;
END
$$;

-- ================================================
-- 7. badge_definitions (徽章定義表)
-- ================================================
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  category text DEFAULT 'general'::text,
  points_reward integer DEFAULT 0,
  requirements jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================
-- 8. user_badges (使用者徽章持有表)
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now()
);

-- 建立約束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_user_id_badge_id_key'
  ) THEN
    ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key
      UNIQUE (user_id, badge_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_badge_id_fkey'
  ) THEN
    ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_badge_id_fkey
      FOREIGN KEY (badge_id) REFERENCES public.badge_definitions(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- ================================================
-- 9. 額外欄位: customers.total_points
-- ================================================
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

-- ================================================
-- 10. 建立索引 (提升查詢效能)
-- ================================================
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary_id ON public.itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_id ON public.itinerary_items(itinerary_day_id);
CREATE INDEX IF NOT EXISTS idx_customer_assigned_customer ON public.customer_assigned_itineraries(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_assigned_itinerary ON public.customer_assigned_itineraries(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_assigned ON public.trip_members(assigned_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_customer ON public.trip_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_customization_customer ON public.customization_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_customization_assigned ON public.customization_requests(assigned_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_active ON public.badge_definitions(is_active);

-- ================================================
-- 完成
-- ================================================
-- 此 migration 檔案記錄了「旅人護照」與「旅人眼線」系統的核心資料表結構
-- 作為專案的「創世文件」，未來所有資料庫變更應基於此結構進行
