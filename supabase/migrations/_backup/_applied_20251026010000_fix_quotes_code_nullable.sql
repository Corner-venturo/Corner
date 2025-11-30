-- ============================================
-- Migration: 修復 quotes.code 欄位的 NOT NULL 限制
-- 日期: 2025-10-26
-- 說明: 允許 code 欄位為 NULL，或在同步時自動生成
-- ============================================

BEGIN;

-- 方案 1: 將 code 改為可 NULL（推薦）
ALTER TABLE public.quotes
  ALTER COLUMN code DROP NOT NULL;

-- 方案 2: 為 NULL 的 code 設定預設值函數（備用）
CREATE OR REPLACE FUNCTION generate_quote_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    -- 生成格式：QT-YYYYMMDD-序號
    NEW.code := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('quote_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立序列（如果不存在）
CREATE SEQUENCE IF NOT EXISTS quote_code_seq START 1;

-- 建立觸發器（如果不存在）
DROP TRIGGER IF EXISTS trigger_generate_quote_code ON public.quotes;
CREATE TRIGGER trigger_generate_quote_code
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_code();

COMMENT ON COLUMN public.quotes.code IS '報價單編號（可為 NULL，插入時自動生成）';

-- 驗證
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 完成！';
  RAISE NOTICE '   - quotes.code 欄位已改為可 NULL';
  RAISE NOTICE '   - 新增自動生成 code 的觸發器';
END $$;

COMMIT;
