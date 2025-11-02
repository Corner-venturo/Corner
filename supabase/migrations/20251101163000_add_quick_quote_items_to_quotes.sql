-- 為 quotes 表格新增 quick_quote_items 欄位
-- 用於儲存快速報價單的收費明細項目

BEGIN;

-- 新增 quick_quote_items 欄位 (JSONB 類型)
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS quick_quote_items JSONB DEFAULT '[]'::jsonb;

-- 新增註解
COMMENT ON COLUMN public.quotes.quick_quote_items IS 'Quick quote items (description, quantity, unit_price, amount, notes)';

COMMIT;
