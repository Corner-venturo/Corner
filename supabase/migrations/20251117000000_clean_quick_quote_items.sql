-- 清理快速報價單在 quote_items 表格的錯誤資料
-- 快速報價單的項目應該存在 quotes.quick_quote_items JSONB 欄位，而非 quote_items 表格

BEGIN;

-- 刪除所有快速報價單關聯的 quote_items
DELETE FROM public.quote_items
WHERE quote_id IN (
  SELECT id FROM public.quotes WHERE quote_type = 'quick'
);

-- 記錄清理結果
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '已刪除 % 筆快速報價單的 quote_items 資料', deleted_count;
END $$;

COMMIT;
