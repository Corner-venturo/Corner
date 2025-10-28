-- ============================================
-- Migration: 新增 quotes 表格缺少的欄位
-- 日期: 2025-10-26
-- 說明: 修復前端同步失敗問題 - 新增 total_cost 等欄位
-- ============================================

BEGIN;

-- ============================================
-- 1. Quotes 表格：新增缺少的欄位
-- ============================================

ALTER TABLE public.quotes
  -- 總成本欄位（前端計算用）
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2) DEFAULT 0,

  -- 客戶資訊欄位（如果之前的 migration 未執行）
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,

  -- 參與人數統計
  ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infant_count INTEGER DEFAULT 0,

  -- 擴展資料欄位（JSON 格式）
  ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS participant_counts JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selling_prices JSONB DEFAULT '{}',

  -- 版本歷史
  ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]';

-- ============================================
-- 2. 建立索引以提升查詢效能
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotes_total_cost ON public.quotes(total_cost);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON public.quotes(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_adult_count ON public.quotes(adult_count);

-- ============================================
-- 3. 欄位說明
-- ============================================

COMMENT ON COLUMN public.quotes.total_cost IS '總成本（前端計算的成本金額）';
COMMENT ON COLUMN public.quotes.customer_email IS '客戶 Email';
COMMENT ON COLUMN public.quotes.customer_phone IS '客戶電話';
COMMENT ON COLUMN public.quotes.adult_count IS '成人人數';
COMMENT ON COLUMN public.quotes.child_count IS '兒童人數';
COMMENT ON COLUMN public.quotes.infant_count IS '嬰兒人數';
COMMENT ON COLUMN public.quotes.categories IS '報價分類詳細資料（JSON 格式，包含成本明細）';
COMMENT ON COLUMN public.quotes.participant_counts IS '參與人數統計（JSON 格式）';
COMMENT ON COLUMN public.quotes.selling_prices IS '銷售價格設定（JSON 格式）';
COMMENT ON COLUMN public.quotes.versions IS '歷史版本記錄（JSON 格式）';

-- ============================================
-- 4. 驗證
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 檢查 total_cost
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'total_cost') THEN
    missing_columns := array_append(missing_columns, 'quotes.total_cost');
  END IF;

  -- 檢查 categories
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'categories') THEN
    missing_columns := array_append(missing_columns, 'quotes.categories');
  END IF;

  -- 如果有缺失欄位，拋出錯誤
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration 失敗：缺少欄位 %', array_to_string(missing_columns, ', ');
  END IF;

  -- 成功訊息
  RAISE NOTICE '✅ Migration 完成！';
  RAISE NOTICE '   - Quotes 表格新增 10 個欄位';
  RAISE NOTICE '   - total_cost: 總成本計算欄位';
  RAISE NOTICE '   - categories: 報價分類詳細資料';
  RAISE NOTICE '   - participant_counts: 參與人數統計';
  RAISE NOTICE '   - selling_prices: 銷售價格設定';
END $$;

COMMIT;
