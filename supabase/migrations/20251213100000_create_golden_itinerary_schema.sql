-- Golden Schema: 行程相關資料表（ERP 與 App 共享）
-- 建立時間: 2025-12-13
-- 目的: 建立 ERP 與旅遊 App 之間的資料共享契約

BEGIN;

-- 檢查並啟用 uuid-ossp 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 更新 itineraries 表（添加 App 需要的欄位）
-- ============================================
-- itineraries 表已存在，只需添加缺少的欄位

-- 添加 erp_itinerary_id（如果不存在）- 用於 ERP 追蹤
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS erp_itinerary_id text;

-- 添加 summary（如果不存在）- 簡短摘要
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS summary text;

-- 添加 duration_days（如果不存在）- 天數
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS duration_days integer;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_itineraries_erp_id ON public.itineraries(erp_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON public.itineraries(status);

-- ============================================
-- 2. itinerary_days (每日行程表)
-- ============================================
-- 用途: 存放行程中每一天的具體行程安排
-- 注意: 這是正規化的結構，與現有 daily_itinerary JSON 欄位並存
-- 注意: itineraries.id 是 uuid 類型

CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (itinerary_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON public.itinerary_days(itinerary_id);

COMMENT ON TABLE public.itinerary_days IS '每日行程表 - 儲存行程中每一天的安排';
COMMENT ON COLUMN public.itinerary_days.day_number IS '第幾天 (1, 2, 3...)';

-- ============================================
-- 3. itinerary_items (行程項目表)
-- ============================================
-- 用途: 儲存每日行程中的具體活動、景點、餐飲、住宿等

CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_day_id uuid NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  item_order integer NOT NULL DEFAULT 0,
  item_type text NOT NULL,
  name text NOT NULL,
  description text,
  location text,
  latitude double precision,
  longitude double precision,
  start_time time,
  end_time time,
  duration_minutes integer,
  image_url text,
  booking_details jsonb,
  attraction_id uuid REFERENCES public.attractions(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_itinerary_items_day ON public.itinerary_items(itinerary_day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_type ON public.itinerary_items(item_type);

COMMENT ON TABLE public.itinerary_items IS '行程項目表 - 每日的具體活動';
COMMENT ON COLUMN public.itinerary_items.item_type IS '項目類型: attraction, restaurant, hotel, transport, activity, other';
COMMENT ON COLUMN public.itinerary_items.item_order IS '排序順序';
COMMENT ON COLUMN public.itinerary_items.attraction_id IS '關聯景點（可選）';

-- ============================================
-- 4. customer_assigned_itineraries (客戶指派行程表)
-- ============================================
-- 用途: 記錄哪個客戶被指派了哪個行程

CREATE TABLE IF NOT EXISTS public.customer_assigned_itineraries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_date date NOT NULL,
  status text NOT NULL DEFAULT 'assigned',
  notes text,
  workspace_id uuid REFERENCES public.workspaces(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (customer_id, itinerary_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_assigned_customer ON public.customer_assigned_itineraries(customer_id);
CREATE INDEX IF NOT EXISTS idx_assigned_itinerary ON public.customer_assigned_itineraries(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_assigned_order ON public.customer_assigned_itineraries(order_id);
CREATE INDEX IF NOT EXISTS idx_assigned_workspace ON public.customer_assigned_itineraries(workspace_id);

COMMENT ON TABLE public.customer_assigned_itineraries IS '客戶指派行程表';
COMMENT ON COLUMN public.customer_assigned_itineraries.status IS '狀態: assigned, confirmed, completed, cancelled';
COMMENT ON COLUMN public.customer_assigned_itineraries.order_id IS '關聯訂單（可選）';

-- ============================================
-- 5. customization_requests (客製化需求表)
-- ============================================
-- 用途: 存放客戶提交的客製化需求

CREATE TABLE IF NOT EXISTS public.customization_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_itinerary_id uuid NOT NULL REFERENCES public.customer_assigned_itineraries(id) ON DELETE CASCADE,
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  response_text text,
  handled_by uuid REFERENCES public.employees(id),
  handled_at timestamptz,
  workspace_id uuid REFERENCES public.workspaces(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customization_customer ON public.customization_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_customization_assigned ON public.customization_requests(assigned_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_customization_status ON public.customization_requests(status);
CREATE INDEX IF NOT EXISTS idx_customization_workspace ON public.customization_requests(workspace_id);

COMMENT ON TABLE public.customization_requests IS '客製化需求表';
COMMENT ON COLUMN public.customization_requests.status IS '狀態: new, in_progress, completed, rejected';

-- ============================================
-- 6. trip_members (旅伴成員表)
-- ============================================
-- 用途: 記錄一個客戶指派行程中有哪些旅伴

CREATE TABLE IF NOT EXISTS public.trip_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_itinerary_id uuid NOT NULL REFERENCES public.customer_assigned_itineraries(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  app_user_id text,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES public.customers(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (assigned_itinerary_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_members_assigned ON public.trip_members(assigned_itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_customer ON public.trip_members(customer_id);

COMMENT ON TABLE public.trip_members IS '旅伴成員表';
COMMENT ON COLUMN public.trip_members.role IS '角色: organizer, member, pending_invite';
COMMENT ON COLUMN public.trip_members.status IS '狀態: active, inactive';
COMMENT ON COLUMN public.trip_members.app_user_id IS 'App 用戶 ID（未來擴展用）';

-- ============================================
-- 7. 建立 updated_at 觸發器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- itinerary_days
DROP TRIGGER IF EXISTS update_itinerary_days_updated_at ON public.itinerary_days;
CREATE TRIGGER update_itinerary_days_updated_at
BEFORE UPDATE ON public.itinerary_days
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- itinerary_items
DROP TRIGGER IF EXISTS update_itinerary_items_updated_at ON public.itinerary_items;
CREATE TRIGGER update_itinerary_items_updated_at
BEFORE UPDATE ON public.itinerary_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- customer_assigned_itineraries
DROP TRIGGER IF EXISTS update_customer_assigned_itineraries_updated_at ON public.customer_assigned_itineraries;
CREATE TRIGGER update_customer_assigned_itineraries_updated_at
BEFORE UPDATE ON public.customer_assigned_itineraries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- customization_requests
DROP TRIGGER IF EXISTS update_customization_requests_updated_at ON public.customization_requests;
CREATE TRIGGER update_customization_requests_updated_at
BEFORE UPDATE ON public.customization_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- trip_members
DROP TRIGGER IF EXISTS update_trip_members_updated_at ON public.trip_members;
CREATE TRIGGER update_trip_members_updated_at
BEFORE UPDATE ON public.trip_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. RLS 策略（依照專案規範：業務資料啟用 RLS）
-- ============================================

-- itinerary_days: 啟用 RLS，透過父表 itineraries 的 workspace_id 控制
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itinerary_days_select" ON public.itinerary_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_days.itinerary_id
    AND (i.workspace_id = get_current_user_workspace() OR is_super_admin() OR i.status = 'published')
  )
);

CREATE POLICY "itinerary_days_insert" ON public.itinerary_days FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_days.itinerary_id
    AND i.workspace_id = get_current_user_workspace()
  )
);

CREATE POLICY "itinerary_days_update" ON public.itinerary_days FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_days.itinerary_id
    AND (i.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

CREATE POLICY "itinerary_days_delete" ON public.itinerary_days FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_days.itinerary_id
    AND (i.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

-- itinerary_items: 透過 itinerary_days → itineraries 控制
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itinerary_items_select" ON public.itinerary_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.itineraries i ON i.id = d.itinerary_id
    WHERE d.id = itinerary_items.itinerary_day_id
    AND (i.workspace_id = get_current_user_workspace() OR is_super_admin() OR i.status = 'published')
  )
);

CREATE POLICY "itinerary_items_insert" ON public.itinerary_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.itineraries i ON i.id = d.itinerary_id
    WHERE d.id = itinerary_items.itinerary_day_id
    AND i.workspace_id = get_current_user_workspace()
  )
);

CREATE POLICY "itinerary_items_update" ON public.itinerary_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.itineraries i ON i.id = d.itinerary_id
    WHERE d.id = itinerary_items.itinerary_day_id
    AND (i.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

CREATE POLICY "itinerary_items_delete" ON public.itinerary_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.itineraries i ON i.id = d.itinerary_id
    WHERE d.id = itinerary_items.itinerary_day_id
    AND (i.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

-- customer_assigned_itineraries: workspace 隔離
ALTER TABLE public.customer_assigned_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assigned_itineraries_select" ON public.customer_assigned_itineraries FOR SELECT
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "assigned_itineraries_insert" ON public.customer_assigned_itineraries FOR INSERT
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "assigned_itineraries_update" ON public.customer_assigned_itineraries FOR UPDATE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "assigned_itineraries_delete" ON public.customer_assigned_itineraries FOR DELETE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

-- customization_requests: workspace 隔離
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customization_requests_select" ON public.customization_requests FOR SELECT
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "customization_requests_insert" ON public.customization_requests FOR INSERT
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "customization_requests_update" ON public.customization_requests FOR UPDATE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "customization_requests_delete" ON public.customization_requests FOR DELETE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

-- trip_members: 透過 assigned_itinerary 的 workspace 控制
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_members_select" ON public.trip_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_assigned_itineraries a
    WHERE a.id = trip_members.assigned_itinerary_id
    AND (a.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

CREATE POLICY "trip_members_insert" ON public.trip_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customer_assigned_itineraries a
    WHERE a.id = trip_members.assigned_itinerary_id
    AND a.workspace_id = get_current_user_workspace()
  )
);

CREATE POLICY "trip_members_update" ON public.trip_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customer_assigned_itineraries a
    WHERE a.id = trip_members.assigned_itinerary_id
    AND (a.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

CREATE POLICY "trip_members_delete" ON public.trip_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.customer_assigned_itineraries a
    WHERE a.id = trip_members.assigned_itinerary_id
    AND (a.workspace_id = get_current_user_workspace() OR is_super_admin())
  )
);

COMMIT;
