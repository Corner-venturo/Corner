-- =====================================================
-- 建立出團資料表系統
-- 建立日期：2025-11-17
-- 說明：儲存出團資料表的所有資訊
-- =====================================================

BEGIN;

-- 出團資料表主表（基本資訊）
CREATE TABLE IF NOT EXISTS public.tour_departure_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,

  -- 基本資訊
  tour_leader VARCHAR(100),           -- 隨團領隊
  tour_leader_contact VARCHAR(100),   -- 領隊聯絡方式
  sales_person VARCHAR(100),          -- 承辦業務
  sales_contact VARCHAR(100),         -- 業務聯絡方式
  assistant_person VARCHAR(100),      -- 助理人員
  assistant_contact VARCHAR(100),     -- 助理聯絡方式
  flight_info TEXT,                   -- 航班資訊

  -- 其他費用
  service_fee_per_person INTEGER DEFAULT 1500,  -- 領隊服務費（每人）
  petty_cash INTEGER DEFAULT 0,                 -- 零用金

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tour_departure_data UNIQUE(tour_id)
);

-- 餐食表
CREATE TABLE IF NOT EXISTS public.tour_departure_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_data_id UUID NOT NULL REFERENCES public.tour_departure_data(id) ON DELETE CASCADE,

  date DATE NOT NULL,                 -- 用餐日期
  restaurant_name VARCHAR(200),       -- 餐廳名稱
  reservation_time VARCHAR(50),       -- 預訂時間
  reservation_name VARCHAR(100),      -- 訂位名稱
  reservation_count INTEGER,          -- 訂位人數
  unit_price INTEGER,                 -- 商品單價
  quantity INTEGER,                   -- 數量
  subtotal INTEGER,                   -- 小計
  expected_amount INTEGER,            -- 預計支出
  actual_amount INTEGER,              -- 實際支出
  address TEXT,                       -- 地址
  phone VARCHAR(50),                  -- 電話
  notes TEXT,                         -- 說明/備註
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 住宿表
CREATE TABLE IF NOT EXISTS public.tour_departure_accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_data_id UUID NOT NULL REFERENCES public.tour_departure_data(id) ON DELETE CASCADE,

  date DATE NOT NULL,                 -- 入住日期
  hotel_name VARCHAR(200),            -- 飯店名稱
  room_type VARCHAR(100),             -- 需求房型
  bed_type VARCHAR(100),              -- 床型安排
  unit_price INTEGER,                 -- 商品單價
  quantity INTEGER,                   -- 數量
  subtotal INTEGER,                   -- 小計
  expected_amount INTEGER,            -- 預計支出
  actual_amount INTEGER,              -- 實際支出
  address TEXT,                       -- 地址
  phone VARCHAR(50),                  -- 電話
  notes TEXT,                         -- 說明/備註
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 活動表（門票、景點）
CREATE TABLE IF NOT EXISTS public.tour_departure_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_data_id UUID NOT NULL REFERENCES public.tour_departure_data(id) ON DELETE CASCADE,

  date DATE NOT NULL,                 -- 活動日期
  venue_name VARCHAR(200),            -- 場地名稱
  unit_price INTEGER,                 -- 商品單價
  quantity INTEGER,                   -- 數量
  subtotal INTEGER,                   -- 小計
  expected_amount INTEGER,            -- 預計支出
  actual_amount INTEGER,              -- 實際支出
  notes TEXT,                         -- 說明/備註
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 其他費用表
CREATE TABLE IF NOT EXISTS public.tour_departure_others (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_data_id UUID NOT NULL REFERENCES public.tour_departure_data(id) ON DELETE CASCADE,

  date DATE NOT NULL,                 -- 日期
  item_name VARCHAR(200),             -- 商品名稱
  unit_price INTEGER,                 -- 商品單價
  quantity INTEGER,                   -- 數量
  subtotal INTEGER,                   -- 小計
  expected_amount INTEGER,            -- 預計支出
  actual_amount INTEGER,              -- 實際支出
  notes TEXT,                         -- 說明/備註
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tour_departure_data_tour ON public.tour_departure_data(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_departure_meals_data ON public.tour_departure_meals(departure_data_id);
CREATE INDEX IF NOT EXISTS idx_tour_departure_accommodations_data ON public.tour_departure_accommodations(departure_data_id);
CREATE INDEX IF NOT EXISTS idx_tour_departure_activities_data ON public.tour_departure_activities(departure_data_id);
CREATE INDEX IF NOT EXISTS idx_tour_departure_others_data ON public.tour_departure_others(departure_data_id);

-- 禁用 RLS（依照專案規範）
ALTER TABLE public.tour_departure_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_departure_meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_departure_accommodations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_departure_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_departure_others DISABLE ROW LEVEL SECURITY;

COMMIT;
