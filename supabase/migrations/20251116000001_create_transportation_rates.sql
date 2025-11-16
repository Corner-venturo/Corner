-- 車資參考報價表
-- 目的：按國家建立車資參考資料，用於報價計算

BEGIN;

-- ============================================
-- 1. 建立車資參考報價表
-- ============================================
CREATE TABLE IF NOT EXISTS public.transportation_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 國家關聯
  country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,                -- 國家名稱（冗餘，方便查詢）

  -- 車款資訊
  vehicle_type TEXT NOT NULL,                -- 車款類型（如：45座遊覽車、20座中巴、計程車）

  -- 價格資訊
  price NUMERIC(10, 2) NOT NULL,             -- 參考價格
  currency TEXT NOT NULL DEFAULT 'TWD',      -- 幣別（TWD, JPY, USD, EUR...）
  unit TEXT NOT NULL DEFAULT 'day',          -- 計價單位（day/trip/km）

  -- 補充資訊
  notes TEXT,                                -- 注意事項（如：含司機導遊小費、過路費另計...）

  -- 狀態與排序
  is_active BOOLEAN DEFAULT true,            -- 是否啟用
  display_order INTEGER DEFAULT 0,           -- 顯示順序

  -- 時間戳記
  workspace_id TEXT,                         -- 工作空間 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 建立索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transportation_rates_country
  ON public.transportation_rates(country_id);

CREATE INDEX IF NOT EXISTS idx_transportation_rates_active
  ON public.transportation_rates(country_id, is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_transportation_rates_workspace
  ON public.transportation_rates(workspace_id);

-- ============================================
-- 3. 禁用 RLS（依照專案規範）
-- ============================================
ALTER TABLE public.transportation_rates DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. 更新 updated_at 觸發器
-- ============================================
CREATE TRIGGER update_transportation_rates_updated_at_trigger
  BEFORE UPDATE ON public.transportation_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_regions_updated_at();

-- ============================================
-- 5. 註解
-- ============================================
COMMENT ON TABLE public.transportation_rates IS '車資參考報價表，按國家分類';
COMMENT ON COLUMN public.transportation_rates.vehicle_type IS '車款類型（如：45座遊覽車、20座中巴、計程車）';
COMMENT ON COLUMN public.transportation_rates.price IS '參考價格';
COMMENT ON COLUMN public.transportation_rates.currency IS '幣別（TWD, JPY, USD, EUR...）';
COMMENT ON COLUMN public.transportation_rates.unit IS '計價單位（day=天, trip=趟, km=公里）';
COMMENT ON COLUMN public.transportation_rates.notes IS '注意事項（如：含司機導遊小費、過路費另計...）';

-- ============================================
-- 6. 插入範例資料（空白模板，由使用者填寫）
-- ============================================

-- 日本範例（價格為 0，由使用者填寫）
INSERT INTO public.transportation_rates (country_id, country_name, vehicle_type, price, currency, unit, notes, display_order) VALUES
  ('japan', '日本', '45座遊覽車', 0, 'JPY', 'day', '', 1),
  ('japan', '日本', '20座中巴', 0, 'JPY', 'day', '', 2),
  ('japan', '日本', '計程車', 0, 'JPY', 'trip', '', 3);

-- 泰國範例
INSERT INTO public.transportation_rates (country_id, country_name, vehicle_type, price, currency, unit, notes, display_order) VALUES
  ('thailand', '泰國', '45座遊覽車', 0, 'THB', 'day', '', 1),
  ('thailand', '泰國', '20座中巴', 0, 'THB', 'day', '', 2),
  ('thailand', '泰國', '計程車', 0, 'THB', 'trip', '', 3);

-- 韓國範例
INSERT INTO public.transportation_rates (country_id, country_name, vehicle_type, price, currency, unit, notes, display_order) VALUES
  ('korea', '韓國', '45座遊覽車', 0, 'KRW', 'day', '', 1),
  ('korea', '韓國', '20座中巴', 0, 'KRW', 'day', '', 2),
  ('korea', '韓國', '計程車', 0, 'KRW', 'trip', '', 3);

COMMIT;
