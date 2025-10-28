-- ============================================
-- 整理供應商系統架構
-- Purpose: 清理重複結構，建立清晰的供應商-成本模板架構
-- Date: 2025-10-28
-- ============================================

BEGIN;

-- ============================================
-- 1. 刪除重複的 supplier_products 表
-- ============================================

DROP TABLE IF EXISTS public.supplier_products CASCADE;

COMMENT ON TABLE public.suppliers IS '供應商基本資料（財務用）';


-- ============================================
-- 2. 改名 supplier_cities → supplier_service_areas
-- ============================================

-- 檢查表是否存在，如果存在則改名
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_cities') THEN
    ALTER TABLE public.supplier_cities RENAME TO supplier_service_areas;

    -- 更新註解
    COMMENT ON TABLE public.supplier_service_areas IS '供應商服務區域（多對多關聯）';

    -- 重新命名索引
    ALTER INDEX IF EXISTS idx_supplier_cities_supplier_id RENAME TO idx_supplier_service_areas_supplier_id;
    ALTER INDEX IF EXISTS idx_supplier_cities_city_id RENAME TO idx_supplier_service_areas_city_id;

    -- 重新命名 RLS 政策
    ALTER POLICY IF EXISTS "Allow authenticated users to read supplier_cities"
      ON public.supplier_service_areas RENAME TO "Allow authenticated users to read supplier_service_areas";
    ALTER POLICY IF EXISTS "Allow authenticated users to insert supplier_cities"
      ON public.supplier_service_areas RENAME TO "Allow authenticated users to insert supplier_service_areas";
    ALTER POLICY IF EXISTS "Allow authenticated users to update supplier_cities"
      ON public.supplier_service_areas RENAME TO "Allow authenticated users to update supplier_service_areas";
    ALTER POLICY IF EXISTS "Allow authenticated users to delete supplier_cities"
      ON public.supplier_service_areas RENAME TO "Allow authenticated users to delete supplier_service_areas";
  END IF;
END $$;


-- ============================================
-- 3. 移除 suppliers 表的 city_id 欄位（改用 supplier_service_areas）
-- ============================================

DO $$
BEGIN
  -- 先確保資料已遷移到 supplier_service_areas
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'city_id') THEN
    -- 移除欄位（資料已在 20251028000000_create_supplier_cities.sql 中遷移）
    ALTER TABLE public.suppliers DROP COLUMN IF EXISTS city_id;
    ALTER TABLE public.suppliers DROP COLUMN IF EXISTS region_id;
  END IF;
END $$;


-- ============================================
-- 4. 建立 cost_templates 表（成本模板 - 報價用）
-- ============================================

CREATE TABLE IF NOT EXISTS public.cost_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 供應商關聯
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,

  -- 地區關聯
  city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,

  -- 景點關聯（可選）
  attraction_id UUID REFERENCES public.attractions(id) ON DELETE SET NULL,

  -- 分類
  category TEXT NOT NULL, -- 'accommodation', 'meal', 'transport', 'ticket', 'guide', 'other'

  -- 項目資訊
  item_name TEXT NOT NULL,
  item_name_en TEXT,
  description TEXT,

  -- 價格資訊
  cost_price DECIMAL(10,2) NOT NULL,        -- 成本價
  selling_price DECIMAL(10,2),              -- 建議售價
  currency TEXT DEFAULT 'TWD' NOT NULL,

  -- 計價單位
  unit TEXT NOT NULL,                       -- 'per_night', 'per_person', 'per_vehicle', 'per_group', 'per_item'
  min_quantity INTEGER,                     -- 最低數量
  max_quantity INTEGER,                     -- 最高數量

  -- 有效期
  valid_from DATE,
  valid_until DATE,

  -- 季節（可選）
  season TEXT,                              -- 'low', 'high', 'peak', 'holiday', null

  -- 其他資訊
  duration_minutes INTEGER,                 -- 時長（分鐘）
  capacity INTEGER,                         -- 容量
  notes TEXT,                               -- 備註

  -- 管理欄位
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 5. 建立索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cost_templates_supplier ON public.cost_templates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cost_templates_city ON public.cost_templates(city_id);
CREATE INDEX IF NOT EXISTS idx_cost_templates_attraction ON public.cost_templates(attraction_id);
CREATE INDEX IF NOT EXISTS idx_cost_templates_category ON public.cost_templates(category);
CREATE INDEX IF NOT EXISTS idx_cost_templates_active ON public.cost_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_cost_templates_valid_from ON public.cost_templates(valid_from);
CREATE INDEX IF NOT EXISTS idx_cost_templates_valid_until ON public.cost_templates(valid_until);

-- ============================================
-- 6. 建立 RLS 政策
-- ============================================

ALTER TABLE public.cost_templates ENABLE ROW LEVEL SECURITY;

-- 認證用戶可讀
CREATE POLICY "Allow authenticated users to read cost_templates"
  ON public.cost_templates FOR SELECT
  TO authenticated
  USING (true);

-- 認證用戶可寫
CREATE POLICY "Allow authenticated users to manage cost_templates"
  ON public.cost_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7. 建立觸發器（自動更新 updated_at）
-- ============================================

CREATE TRIGGER update_cost_templates_updated_at
  BEFORE UPDATE ON public.cost_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. 註解
-- ============================================

COMMENT ON TABLE public.cost_templates IS '成本模板（報價用）- 記錄各項服務/產品的成本和售價';
COMMENT ON COLUMN public.cost_templates.supplier_id IS '供應商 ID';
COMMENT ON COLUMN public.cost_templates.city_id IS '城市 ID';
COMMENT ON COLUMN public.cost_templates.attraction_id IS '關聯景點 ID（可選）';
COMMENT ON COLUMN public.cost_templates.category IS '分類：accommodation/meal/transport/ticket/guide/other';
COMMENT ON COLUMN public.cost_templates.item_name IS '項目名稱（如：東京希爾頓 標準雙人房）';
COMMENT ON COLUMN public.cost_templates.cost_price IS '成本價';
COMMENT ON COLUMN public.cost_templates.selling_price IS '建議售價';
COMMENT ON COLUMN public.cost_templates.unit IS '計價單位：per_night/per_person/per_vehicle/per_group/per_item';
COMMENT ON COLUMN public.cost_templates.season IS '季節：low/high/peak/holiday';
COMMENT ON COLUMN public.cost_templates.valid_from IS '有效期開始';
COMMENT ON COLUMN public.cost_templates.valid_until IS '有效期結束';

COMMIT;
