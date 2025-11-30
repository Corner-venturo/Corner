-- ============================================
-- 修復剩餘表格的 workspace_id
-- ============================================

BEGIN;

-- 暫時禁用 trigger 避免 updated_at 錯誤
SET session_replication_role = replica;

DO $$
DECLARE
  default_workspace_id uuid;
  remaining_tables text[] := ARRAY['personal_canvases', 'rich_documents'];
  tbl text;
  has_column boolean;
  row_count integer;
BEGIN
  -- 取得第一個 workspace
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NULL THEN
    RAISE EXCEPTION '沒有找到任何 workspace';
  END IF;

  RAISE NOTICE '處理剩餘表格...';

  FOREACH tbl IN ARRAY remaining_tables
  LOOP
    -- 檢查表格是否存在
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      RAISE NOTICE '⚠️  跳過 %：表格不存在', tbl;
      CONTINUE;
    END IF;

    -- 檢查是否已有 workspace_id 欄位
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'workspace_id'
    ) INTO has_column;

    IF NOT has_column THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN workspace_id uuid', tbl);
      RAISE NOTICE '  ✅ % - 已新增 workspace_id 欄位', tbl;
    ELSE
      RAISE NOTICE '  ✓  % - workspace_id 欄位已存在', tbl;
    END IF;

    -- 更新 NULL 的 workspace_id
    EXECUTE format('UPDATE public.%I SET workspace_id = $1 WHERE workspace_id IS NULL', tbl) USING default_workspace_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;

    IF row_count > 0 THEN
      RAISE NOTICE '     → 已更新 % 筆資料', row_count;
    END IF;

    -- 建立索引
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_workspace_id ON public.%I(workspace_id)', tbl, tbl);
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ 所有表格處理完成！';
END $$;

-- 重新啟用 trigger
SET session_replication_role = DEFAULT;

COMMIT;
