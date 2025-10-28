-- Migration: 修正 suppliers 表結構，對齊前端需求
-- Purpose: 新增缺少的欄位，統一命名
-- Author: Claude Code
-- Date: 2025-10-28

BEGIN;

-- 1. 新增缺少的欄位
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS bank_branch text;

-- 2. 註釋說明
COMMENT ON COLUMN public.suppliers.website IS '供應商網站';
COMMENT ON COLUMN public.suppliers.bank_branch IS '銀行分行';

-- 3. 統一 type 欄位（移除重複的 supplier_type）
-- 保留 type 欄位，移除 supplier_type
ALTER TABLE public.suppliers
DROP COLUMN IF EXISTS supplier_type;

-- 4. 確保 type 欄位使用 ENUM 類型（可選）
-- 先檢查是否有舊資料
DO $$
BEGIN
  -- 如果 type 欄位有值，先遷移舊資料
  UPDATE public.suppliers
  SET type = LOWER(type)
  WHERE type IS NOT NULL;
END $$;

-- 5. 註釋說明欄位用途
COMMENT ON COLUMN public.suppliers.code IS '供應商編號（格式：S{國家代碼}{流水號}，如 SJPN001）';
COMMENT ON COLUMN public.suppliers.country_id IS '國家 ID（關聯 countries 表）';
COMMENT ON COLUMN public.suppliers.region_id IS '地區 ID（關聯 regions 表，可選）';
COMMENT ON COLUMN public.suppliers.city_id IS '主要服務城市 ID（向後相容，建議使用 supplier_cities 表）';
COMMENT ON COLUMN public.suppliers.type IS '供應商類型：hotel, restaurant, transport, ticket, guide, other';
COMMENT ON COLUMN public.suppliers.contact_person IS '聯絡人姓名';
COMMENT ON COLUMN public.suppliers.email IS '電子郵件';
COMMENT ON COLUMN public.suppliers.phone IS '聯絡電話';
COMMENT ON COLUMN public.suppliers.address IS '地址';
COMMENT ON COLUMN public.suppliers.is_active IS '狀態（true=active, false=inactive）';
COMMENT ON COLUMN public.suppliers.notes IS '備註';
COMMENT ON COLUMN public.suppliers.bank_name IS '銀行名稱';
COMMENT ON COLUMN public.suppliers.bank_account IS '銀行帳號';

-- 6. 建立 price_list 關聯表（如果尚未存在）
CREATE TABLE IF NOT EXISTS public.supplier_price_list (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id text NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,

  -- 價格項目資訊
  item_name text NOT NULL,
  category text NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  unit text NOT NULL, -- 單位：晚、台、人、次等

  -- 季節性定價
  seasonality text, -- peak, regular, off
  valid_from date,
  valid_to date,

  -- 備註
  note text,

  -- 審計欄位
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by text,

  -- 索引
  CONSTRAINT check_seasonality CHECK (seasonality IN ('peak', 'regular', 'off'))
);

-- 7. 建立索引
CREATE INDEX IF NOT EXISTS idx_supplier_price_list_supplier_id ON public.supplier_price_list(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_price_list_category ON public.supplier_price_list(category);

-- 8. 註釋
COMMENT ON TABLE public.supplier_price_list IS '供應商價格表';
COMMENT ON COLUMN public.supplier_price_list.item_name IS '項目名稱';
COMMENT ON COLUMN public.supplier_price_list.category IS '類別';
COMMENT ON COLUMN public.supplier_price_list.unit_price IS '單價';
COMMENT ON COLUMN public.supplier_price_list.unit IS '單位（晚、台、人、次等）';
COMMENT ON COLUMN public.supplier_price_list.seasonality IS '季節性（peak=旺季, regular=平季, off=淡季）';

-- 9. 設定 RLS 策略
ALTER TABLE public.supplier_price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read supplier_price_list"
  ON public.supplier_price_list
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert supplier_price_list"
  ON public.supplier_price_list
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update supplier_price_list"
  ON public.supplier_price_list
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete supplier_price_list"
  ON public.supplier_price_list
  FOR DELETE
  TO authenticated
  USING (true);

COMMIT;
