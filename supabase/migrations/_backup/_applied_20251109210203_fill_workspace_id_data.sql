-- ============================================================
-- Step 2: 填充 workspace_id 資料（禁用觸發器避免錯誤）
-- ============================================================

-- 暫時禁用觸發器
SET session_replication_role = replica;

-- 填充所有表格的 workspace_id
DO $$
DECLARE
  default_workspace_id uuid;
  updated_count integer;
BEGIN
  -- 獲取第一個 workspace
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found. Please create a workspace first.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '使用預設 workspace: %', default_workspace_id;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  -- 更新所有表格
  UPDATE public.tours SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ tours: % 筆', updated_count;

  UPDATE public.orders SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ orders: % 筆', updated_count;

  UPDATE public.itineraries SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ itineraries: % 筆', updated_count;

  UPDATE public.todos SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ todos: % 筆', updated_count;

  UPDATE public.customers SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ customers: % 筆', updated_count;

  UPDATE public.payments SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ payments: % 筆', updated_count;

  UPDATE public.payment_requests SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ payment_requests: % 筆', updated_count;

  UPDATE public.disbursement_orders SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ disbursement_orders: % 筆', updated_count;

  UPDATE public.quotes SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ quotes: % 筆', updated_count;

  UPDATE public.channels SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ channels: % 筆', updated_count;

  UPDATE public.messages SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ messages: % 筆', updated_count;

  UPDATE public.calendar_events SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ calendar_events: % 筆', updated_count;

  UPDATE public.channel_members SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ channel_members: % 筆', updated_count;

  UPDATE public.channel_groups SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ channel_groups: % 筆', updated_count;

  UPDATE public.personal_canvases SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ personal_canvases: % 筆', updated_count;

  UPDATE public.rich_documents SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ rich_documents: % 筆', updated_count;

  UPDATE public.employees SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ employees: % 筆', updated_count;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 所有資料已填充完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- 重新啟用觸發器
SET session_replication_role = DEFAULT;
