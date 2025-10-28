-- 更新供應商管理系統結構

BEGIN;

-- ============================================
-- 1. 更新 suppliers 表（如果已存在則新增欄位）
-- ============================================

-- 基本資料
DO $$
BEGIN
  -- name_en
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'name_en') THEN
    ALTER TABLE public.suppliers ADD COLUMN name_en varchar(255);
  END IF;

  -- code (供應商代碼)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'code') THEN
    ALTER TABLE public.suppliers ADD COLUMN code varchar(50) UNIQUE;
  END IF;

  -- type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'type') THEN
    ALTER TABLE public.suppliers ADD COLUMN type varchar(50);
  END IF;

  -- 地區關聯
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'country_id') THEN
    ALTER TABLE public.suppliers ADD COLUMN country_id varchar(50) REFERENCES public.countries(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'region_id') THEN
    ALTER TABLE public.suppliers ADD COLUMN region_id varchar(50) REFERENCES public.regions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'city_id') THEN
    ALTER TABLE public.suppliers ADD COLUMN city_id varchar(50) REFERENCES public.cities(id) ON DELETE SET NULL;
  END IF;

  -- 財務資訊
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'bank_name') THEN
    ALTER TABLE public.suppliers ADD COLUMN bank_name varchar(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'bank_account') THEN
    ALTER TABLE public.suppliers ADD COLUMN bank_account varchar(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'tax_id') THEN
    ALTER TABLE public.suppliers ADD COLUMN tax_id varchar(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'payment_terms') THEN
    ALTER TABLE public.suppliers ADD COLUMN payment_terms varchar(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'currency') THEN
    ALTER TABLE public.suppliers ADD COLUMN currency varchar(3) DEFAULT 'TWD';
  END IF;

  -- 評級
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'rating') THEN
    ALTER TABLE public.suppliers ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5);
  END IF;

  -- 狀態
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'is_preferred') THEN
    ALTER TABLE public.suppliers ADD COLUMN is_preferred boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'display_order') THEN
    ALTER TABLE public.suppliers ADD COLUMN display_order integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'created_by') THEN
    ALTER TABLE public.suppliers ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'updated_by') THEN
    ALTER TABLE public.suppliers ADD COLUMN updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- 索引
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON public.suppliers(country_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_region ON public.suppliers(region_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON public.suppliers(city_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON public.suppliers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

-- 註解
COMMENT ON TABLE public.suppliers IS '供應商管理表';
COMMENT ON COLUMN public.suppliers.code IS '供應商代碼，用於會計系統對帳';
COMMENT ON COLUMN public.suppliers.type IS '供應商類型：旅行社/票務/交通/餐廳/住宿/導遊/其他';
COMMENT ON COLUMN public.suppliers.rating IS '供應商評級 1-5 星';
COMMENT ON COLUMN public.suppliers.is_preferred IS '是否為優先供應商（同產品優先顯示）';

-- ============================================
-- 2. 供應商產品表（供應商提供的服務/產品）
-- ============================================
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 供應商關聯（使用 text 類型配合現有 suppliers 表）
  supplier_id text NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,

  -- 產品資訊
  product_type varchar(50) NOT NULL, -- attraction/transport/ticket/meal/accommodation/guide
  product_name varchar(255) NOT NULL,
  product_name_en varchar(255),
  description text,

  -- 關聯到具體資源（可選）
  attraction_id uuid REFERENCES public.attractions(id) ON DELETE SET NULL,
  -- transport 和其他類型暫時用 JSON 儲存，未來可建立專門表

  -- 價格資訊
  price_per_person decimal(10, 2), -- 個人價格
  price_per_group decimal(10, 2), -- 團體價格
  min_quantity integer, -- 最低數量
  max_quantity integer, -- 最高數量
  is_group_price boolean DEFAULT false, -- 是否為團體計價

  -- 有效期
  valid_from date,
  valid_to date,

  -- 其他資訊
  capacity integer, -- 容量（交通工具用）
  duration_minutes integer, -- 時長（活動用）

  -- 優先級
  is_default boolean DEFAULT false, -- 是否為此產品的預設供應商
  display_order integer DEFAULT 0,

  -- 狀態
  is_active boolean DEFAULT true,

  -- 備註
  notes text,

  -- 系統欄位
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- 索引
CREATE INDEX idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_type ON public.supplier_products(product_type);
CREATE INDEX idx_supplier_products_attraction ON public.supplier_products(attraction_id);
CREATE INDEX idx_supplier_products_active ON public.supplier_products(is_active);
CREATE INDEX idx_supplier_products_default ON public.supplier_products(is_default);

-- 註解
COMMENT ON TABLE public.supplier_products IS '供應商提供的產品/服務價格表';
COMMENT ON COLUMN public.supplier_products.product_type IS '產品類型：attraction/transport/ticket/meal/accommodation/guide';
COMMENT ON COLUMN public.supplier_products.is_default IS '是否為此產品的預設供應商（報價時優先顯示）';
COMMENT ON COLUMN public.supplier_products.is_group_price IS '是否為團體計價（true=整團價，false=人頭計價）';

-- ============================================
-- 3. RLS 政策
-- ============================================

-- Suppliers 表
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 所有人可讀
CREATE POLICY "suppliers_select_policy"
  ON public.suppliers FOR SELECT
  USING (true);

-- 認證用戶可新增/更新/刪除
CREATE POLICY "suppliers_insert_policy"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "suppliers_update_policy"
  ON public.suppliers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "suppliers_delete_policy"
  ON public.suppliers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Supplier Products 表
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- 所有人可讀
CREATE POLICY "supplier_products_select_policy"
  ON public.supplier_products FOR SELECT
  USING (true);

-- 認證用戶可新增/更新/刪除
CREATE POLICY "supplier_products_insert_policy"
  ON public.supplier_products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "supplier_products_update_policy"
  ON public.supplier_products FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "supplier_products_delete_policy"
  ON public.supplier_products FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 4. 觸發器：自動更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

CREATE TRIGGER supplier_products_updated_at_trigger
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

COMMIT;
