-- ============================================
-- Migration: 新增快速報價單欄位
-- 日期: 2025-11-01
-- 說明: 新增快速報價單所需的欄位，支援簡單收款報價單功能
-- ============================================

BEGIN;

-- ============================================
-- 1. 新增快速報價單相關欄位
-- ============================================

-- 報價單類型（standard: 團體報價單, quick: 快速報價單）
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_type TEXT DEFAULT 'standard' CHECK (quote_type IN ('standard', 'quick'));

-- 快速報價單專用欄位
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_address TEXT,
  ADD COLUMN IF NOT EXISTS tour_code TEXT,
  ADD COLUMN IF NOT EXISTS handler_name TEXT DEFAULT 'William',
  ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS received_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(12, 2) DEFAULT 0;

-- ============================================
-- 2. 建立索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotes_quote_type ON public.quotes(quote_type);
CREATE INDEX IF NOT EXISTS idx_quotes_tour_code ON public.quotes(tour_code) WHERE tour_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON public.quotes(issue_date) WHERE issue_date IS NOT NULL;

-- ============================================
-- 3. 欄位說明
-- ============================================

COMMENT ON COLUMN public.quotes.quote_type IS '報價單類型：standard=團體報價單, quick=快速報價單';
COMMENT ON COLUMN public.quotes.contact_phone IS '聯絡電話（快速報價單用）';
COMMENT ON COLUMN public.quotes.contact_address IS '通訊地址（快速報價單用）';
COMMENT ON COLUMN public.quotes.tour_code IS '團體編號（快速報價單用）';
COMMENT ON COLUMN public.quotes.handler_name IS '承辦業務（快速報價單用）';
COMMENT ON COLUMN public.quotes.issue_date IS '開單日期（快速報價單用）';
COMMENT ON COLUMN public.quotes.received_amount IS '已收金額';
COMMENT ON COLUMN public.quotes.balance_amount IS '應收餘額（total_amount - received_amount）';

-- ============================================
-- 4. 更新現有資料（將現有報價單標記為 standard）
-- ============================================

UPDATE public.quotes
SET quote_type = 'standard'
WHERE quote_type IS NULL;

-- ============================================
-- 5. 建立觸發器：自動計算應收餘額
-- ============================================

CREATE OR REPLACE FUNCTION calculate_quote_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- 自動計算應收餘額 = 應收金額 - 已收金額
  NEW.balance_amount := COALESCE(NEW.total_amount, 0) - COALESCE(NEW.received_amount, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_quote_balance ON public.quotes;

CREATE TRIGGER trg_calculate_quote_balance
  BEFORE INSERT OR UPDATE OF total_amount, received_amount ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_balance();

-- ============================================
-- 6. 驗證
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 檢查所有新增欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'quote_type') THEN
    missing_columns := array_append(missing_columns, 'quotes.quote_type');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'contact_phone') THEN
    missing_columns := array_append(missing_columns, 'quotes.contact_phone');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'contact_address') THEN
    missing_columns := array_append(missing_columns, 'quotes.contact_address');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'tour_code') THEN
    missing_columns := array_append(missing_columns, 'quotes.tour_code');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'handler_name') THEN
    missing_columns := array_append(missing_columns, 'quotes.handler_name');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'issue_date') THEN
    missing_columns := array_append(missing_columns, 'quotes.issue_date');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'received_amount') THEN
    missing_columns := array_append(missing_columns, 'quotes.received_amount');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'balance_amount') THEN
    missing_columns := array_append(missing_columns, 'quotes.balance_amount');
  END IF;

  -- 如果有缺失欄位，拋出錯誤
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration 失敗：缺少欄位 %', array_to_string(missing_columns, ', ');
  END IF;

  -- 成功訊息
  RAISE NOTICE '✅ Migration 完成！';
  RAISE NOTICE '   - 新增 quote_type 欄位（standard/quick）';
  RAISE NOTICE '   - 新增快速報價單專用欄位';
  RAISE NOTICE '   - 建立自動計算應收餘額的觸發器';
END $$;

COMMIT;
