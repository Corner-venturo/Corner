-- 填充所有 NULL workspace_id 到台北辦公室
-- 確保所有資料都有正確的 workspace 歸屬

BEGIN;

DO $$
DECLARE
  taipei_workspace_id uuid;
  affected_count integer := 0;
  total_affected integer := 0;
BEGIN
  -- 取得台北辦公室的 workspace_id
  SELECT id INTO taipei_workspace_id
  FROM public.workspaces
  WHERE code = 'TP'
  LIMIT 1;

  IF taipei_workspace_id IS NULL THEN
    RAISE EXCEPTION '找不到台北辦公室 (TP)';
  END IF;

  RAISE NOTICE '✅ 台北辦公室 ID: %', taipei_workspace_id;
  RAISE NOTICE '';
  RAISE NOTICE '開始填充 NULL workspace_id...';
  RAISE NOTICE '';

  -- Quotes
  UPDATE public.quotes
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ quotes: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Calendar Events
  UPDATE public.calendar_events
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ calendar_events: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Todos
  UPDATE public.todos
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ todos: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Tours
  UPDATE public.tours
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ tours: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Orders
  UPDATE public.orders
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ orders: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Customers
  UPDATE public.customers
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ customers: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Itineraries
  UPDATE public.itineraries
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ itineraries: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Channels
  UPDATE public.channels
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ channels: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  -- Messages
  UPDATE public.messages
  SET workspace_id = taipei_workspace_id
  WHERE workspace_id IS NULL
  AND channel_id IN (SELECT id FROM public.channels WHERE workspace_id = taipei_workspace_id);

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  IF affected_count > 0 THEN
    RAISE NOTICE '  ✓ messages: % 筆', affected_count;
    total_affected := total_affected + affected_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ 總共填充了 % 筆資料到台北辦公室', total_affected;

END $$;

COMMIT;
