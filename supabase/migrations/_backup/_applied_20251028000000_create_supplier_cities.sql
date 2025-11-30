-- Migration: 建立 supplier_cities 多對多關聯表
-- Purpose: 支援供應商服務多個城市
-- Author: Claude Code
-- Date: 2025-10-28

BEGIN;

-- 1. 建立 supplier_cities 關聯表
CREATE TABLE IF NOT EXISTS public.supplier_cities (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id text NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  city_id text NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,

  -- 審計欄位
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by text,

  -- 唯一約束：同一供應商不能重複關聯同一城市
  UNIQUE(supplier_id, city_id)
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_supplier_cities_supplier_id ON public.supplier_cities(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cities_city_id ON public.supplier_cities(city_id);

-- 3. 加入註釋
COMMENT ON TABLE public.supplier_cities IS '供應商與城市的多對多關聯表';
COMMENT ON COLUMN public.supplier_cities.supplier_id IS '供應商 ID';
COMMENT ON COLUMN public.supplier_cities.city_id IS '城市 ID';

-- 4. 設定 RLS 策略
ALTER TABLE public.supplier_cities ENABLE ROW LEVEL SECURITY;

-- 允許所有已認證用戶讀取
CREATE POLICY "Allow authenticated users to read supplier_cities"
  ON public.supplier_cities
  FOR SELECT
  TO authenticated
  USING (true);

-- 允許已認證用戶新增
CREATE POLICY "Allow authenticated users to insert supplier_cities"
  ON public.supplier_cities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允許已認證用戶更新
CREATE POLICY "Allow authenticated users to update supplier_cities"
  ON public.supplier_cities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 允許已認證用戶刪除
CREATE POLICY "Allow authenticated users to delete supplier_cities"
  ON public.supplier_cities
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. 遷移現有資料：將 suppliers.city_id 轉換為 supplier_cities 關聯
INSERT INTO public.supplier_cities (supplier_id, city_id, created_by)
SELECT
  id AS supplier_id,
  city_id,
  created_by
FROM public.suppliers
WHERE city_id IS NOT NULL
ON CONFLICT (supplier_id, city_id) DO NOTHING;

-- 6. 提示：保留 suppliers.city_id 欄位作為主要服務城市（向後相容）
-- 未來可選擇性移除此欄位

COMMIT;
