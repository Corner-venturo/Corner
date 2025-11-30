-- ============================================================
-- 修復剩餘表格的 workspace_id（禁用觸發器）
-- ============================================================

BEGIN;

-- 暫時禁用所有觸發器
SET session_replication_role = replica;

-- 獲取預設 workspace ID
DO $$
DECLARE
  default_workspace_id uuid;
BEGIN
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found';
  END IF;

  RAISE NOTICE '使用預設 workspace: %', default_workspace_id;

  -- 更新剩餘的表格
  UPDATE public.messages SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ messages 已更新: % 筆', (SELECT COUNT(*) FROM public.messages WHERE workspace_id = default_workspace_id);

  UPDATE public.calendar_events SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ calendar_events 已更新: % 筆', (SELECT COUNT(*) FROM public.calendar_events WHERE workspace_id = default_workspace_id);

  UPDATE public.channel_members SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ channel_members 已更新: % 筆', (SELECT COUNT(*) FROM public.channel_members WHERE workspace_id = default_workspace_id);

  UPDATE public.personal_canvases SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ personal_canvases 已更新: % 筆', (SELECT COUNT(*) FROM public.personal_canvases WHERE workspace_id = default_workspace_id);

  UPDATE public.rich_documents SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ rich_documents 已更新: % 筆', (SELECT COUNT(*) FROM public.rich_documents WHERE workspace_id = default_workspace_id);

  UPDATE public.employees SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ employees 已更新: % 筆', (SELECT COUNT(*) FROM public.employees WHERE workspace_id = default_workspace_id);

END $$;

-- 重新啟用觸發器
SET session_replication_role = DEFAULT;

COMMIT;

-- 顯示完成訊息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 剩餘表格更新完成！';
  RAISE NOTICE '====================================';
END $$;
