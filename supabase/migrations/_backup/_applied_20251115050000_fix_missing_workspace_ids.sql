-- 修復缺少 workspace_id 的資料
-- 診斷發現 1 筆 quote 和 1 筆 calendar_event 缺少 workspace_id

BEGIN;

-- 取得第一個 workspace (台北辦公室) 作為預設值
DO $$
DECLARE
  default_workspace_id uuid;
BEGIN
  -- 取得台北辦公室 ID
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  WHERE code = 'TP'
  LIMIT 1;

  IF default_workspace_id IS NULL THEN
    RAISE EXCEPTION '找不到台北辦公室 (TP)';
  END IF;

  -- 更新 quotes 表格中缺少 workspace_id 的資料
  UPDATE public.quotes
  SET workspace_id = default_workspace_id
  WHERE workspace_id IS NULL;

  RAISE NOTICE '✅ 已修復 % 筆 quotes', (SELECT COUNT(*) FROM pg_stat_activity WHERE 1=0);

  -- 更新 calendar_events 表格中缺少 workspace_id 的資料
  UPDATE public.calendar_events
  SET workspace_id = default_workspace_id
  WHERE workspace_id IS NULL;

  RAISE NOTICE '✅ 已修復 calendar_events';

  -- 驗證結果
  RAISE NOTICE '驗證修復結果：';
  RAISE NOTICE ' - quotes 缺少 workspace_id: % 筆', (
    SELECT COUNT(*) FROM public.quotes WHERE workspace_id IS NULL
  );
  RAISE NOTICE ' - calendar_events 缺少 workspace_id: % 筆', (
    SELECT COUNT(*) FROM public.calendar_events WHERE workspace_id IS NULL
  );

END $$;

COMMIT;
