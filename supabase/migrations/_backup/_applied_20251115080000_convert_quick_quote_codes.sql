-- 將舊的快速報價單編號從 Q-xxx 轉換為 TP-Q001 格式
BEGIN;

-- 取得台北辦公室的 ID 和 code
DO $$
DECLARE
  taipei_id uuid;
  taipei_code text;
  quick_quote_record RECORD;
  new_code text;
  counter integer := 1;
BEGIN
  -- 取得台北辦公室資訊
  SELECT id, code INTO taipei_id, taipei_code
  FROM public.workspaces
  WHERE name = '台北辦公室'
  LIMIT 1;

  IF taipei_id IS NULL THEN
    RAISE EXCEPTION '找不到台北辦公室';
  END IF;

  RAISE NOTICE '台北辦公室: ID=%, Code=%', taipei_id, taipei_code;
  RAISE NOTICE '';
  RAISE NOTICE '開始轉換快速報價單編號...';
  RAISE NOTICE '';

  -- 轉換所有 Q-xxx 格式的快速報價單
  FOR quick_quote_record IN
    SELECT id, code, customer_name, workspace_id
    FROM public.quotes
    WHERE quote_type = 'quick' AND code LIKE 'Q-%'
    ORDER BY created_at
  LOOP
    -- 生成新編號：TP-Q001, TP-Q002...
    new_code := taipei_code || '-Q' || LPAD(counter::text, 3, '0');

    RAISE NOTICE '轉換: % → % (客戶: %)',
      quick_quote_record.code,
      new_code,
      COALESCE(quick_quote_record.customer_name, '(無)');

    -- 更新編號
    UPDATE public.quotes
    SET code = new_code
    WHERE id = quick_quote_record.id;

    -- 如果沒有 workspace_id，補上台北辦公室
    IF quick_quote_record.workspace_id IS NULL THEN
      UPDATE public.quotes
      SET workspace_id = taipei_id
      WHERE id = quick_quote_record.id;

      RAISE NOTICE '  ↳ 同時補上 workspace_id';
    END IF;

    counter := counter + 1;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ 已轉換 % 筆快速報價單', counter - 1;
END $$;

COMMIT;
