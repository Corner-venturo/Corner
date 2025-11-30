-- 刪除編號格式錯誤的報價單（缺少 workspace code 的 -A001, -A002, -A003）
BEGIN;

-- 顯示要刪除的資料
DO $$
DECLARE
  quote_record RECORD;
BEGIN
  RAISE NOTICE '準備刪除以下報價單:';
  FOR quote_record IN
    SELECT id, code, name, customer_name, quote_type
    FROM public.quotes
    WHERE code LIKE '-%'
  LOOP
    RAISE NOTICE '  - % | % | %', quote_record.code,
      COALESCE(quote_record.name, quote_record.customer_name, '(無名稱)'),
      quote_record.quote_type;
  END LOOP;
END $$;

-- 刪除編號格式錯誤的報價單
DELETE FROM public.quotes
WHERE code LIKE '-%';

COMMIT;
