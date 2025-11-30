-- ============================================
-- Migration: 新增 quotes 表格的地理位置欄位
-- 日期: 2025-10-28
-- 說明: 修復前端建立報價單時的 country_id 欄位錯誤
-- ============================================

BEGIN;

-- ============================================
-- 1. 新增地理位置相關欄位
-- ============================================

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS country_id TEXT REFERENCES public.countries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS main_city_id TEXT REFERENCES public.cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS other_city_ids TEXT[] DEFAULT '{}';

-- ============================================
-- 2. 建立索引以提升查詢效能
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotes_country_id ON public.quotes(country_id) WHERE country_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_main_city_id ON public.quotes(main_city_id) WHERE main_city_id IS NOT NULL;

-- ============================================
-- 3. 欄位說明
-- ============================================

COMMENT ON COLUMN public.quotes.country_id IS '主要國家 ID（外鍵：countries.id）';
COMMENT ON COLUMN public.quotes.main_city_id IS '主要城市 ID（外鍵：cities.id）';
COMMENT ON COLUMN public.quotes.other_city_ids IS '其他城市 ID 陣列';

-- ============================================
-- 4. 驗證
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 檢查 country_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'country_id') THEN
    missing_columns := array_append(missing_columns, 'quotes.country_id');
  END IF;

  -- 檢查 main_city_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'main_city_id') THEN
    missing_columns := array_append(missing_columns, 'quotes.main_city_id');
  END IF;

  -- 檢查 other_city_ids
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'other_city_ids') THEN
    missing_columns := array_append(missing_columns, 'quotes.other_city_ids');
  END IF;

  -- 如果有缺失欄位，拋出錯誤
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration 失敗：缺少欄位 %', array_to_string(missing_columns, ', ');
  END IF;

  -- 成功訊息
  RAISE NOTICE '✅ Migration 完成！';
  RAISE NOTICE '   - Quotes 表格新增地理位置欄位';
  RAISE NOTICE '   - country_id: 主要國家 ID';
  RAISE NOTICE '   - main_city_id: 主要城市 ID';
  RAISE NOTICE '   - other_city_ids: 其他城市 ID 陣列';
END $$;

COMMIT;
