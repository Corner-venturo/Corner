-- ============================================
-- Step 1: 準備所有表格的 workspace_id 欄位
-- ============================================
-- 這個 migration 會：
-- 1. 檢查並新增缺少的 workspace_id 欄位
-- 2. 將現有資料都設定為第一個 workspace
-- 3. 確保不會有資料因為 RLS 突然消失

BEGIN;

-- 取得第一個 workspace 作為預設值
DO $$
DECLARE
  default_workspace_id uuid;
  tables_to_update text[] := ARRAY[
    'tours', 'orders', 'itineraries', 'itinerary_items', 'tour_participants', 'members',
    'customers', 'contacts', 'companies', 'company_contacts',
    'payments', 'payment_requests', 'payment_request_items', 'disbursement_orders',
    'receipt_orders', 'receipts', 'receipt_items', 'refunds', 'finance_requests', 'ledgers', 'linkpay_logs',
    'contracts', 'quotes', 'quote_items', 'confirmations',
    'disbursements', 'visas', 'esims',
    'calendar_events', 'todos', 'tasks',
    'channels', 'channel_groups', 'messages',
    'personal_canvases', 'rich_documents'
  ];
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
    RAISE EXCEPTION '❌ 沒有找到任何 workspace！請先建立至少一個 workspace。';
  END IF;

  RAISE NOTICE '✅ 使用預設 workspace: %', default_workspace_id;
  RAISE NOTICE '';
  RAISE NOTICE '開始處理表格...';
  RAISE NOTICE '';

  -- 處理每個表格
  FOREACH tbl IN ARRAY tables_to_update
  LOOP
    -- 檢查表格是否存在
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      RAISE NOTICE '⚠️  跳過 %：表格不存在', tbl;
      CONTINUE;
    END IF;

    -- 檢查是否已有 workspace_id 欄位
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'workspace_id'
    ) INTO has_column;

    IF NOT has_column THEN
      -- 新增 workspace_id 欄位
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN workspace_id uuid', tbl);
      RAISE NOTICE '  ✅ % - 已新增 workspace_id 欄位', tbl;
    ELSE
      RAISE NOTICE '  ✓  % - workspace_id 欄位已存在', tbl;
    END IF;

    -- 更新 NULL 的 workspace_id
    EXECUTE format(
      'UPDATE public.%I SET workspace_id = $1 WHERE workspace_id IS NULL',
      tbl
    ) USING default_workspace_id;

    -- 取得受影響的行數
    GET DIAGNOSTICS row_count = ROW_COUNT;

    IF row_count > 0 THEN
      RAISE NOTICE '     → 已更新 % 筆資料', row_count;
    END IF;

    -- 建立索引
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_workspace_id ON public.%I(workspace_id)',
      tbl, tbl
    );
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 所有表格的 workspace_id 已準備完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 下一步：';
  RAISE NOTICE '  執行 20251110120000_simplified_rls_setup.sql';
  RAISE NOTICE '  啟用 RLS 資料隔離';
  RAISE NOTICE '';

END $$;

COMMIT;

-- ============================================
-- 驗證結果
-- ============================================

DO $$
DECLARE
  total_tables integer;
  tables_with_workspace_id integer;
  tables_with_null_workspace_id integer;
BEGIN
  -- 統計有多少表格有 workspace_id 欄位
  SELECT COUNT(DISTINCT table_name) INTO tables_with_workspace_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'workspace_id';

  RAISE NOTICE '📊 統計資訊：';
  RAISE NOTICE '  • 有 workspace_id 欄位的表格：% 個', tables_with_workspace_id;
  RAISE NOTICE '';

END $$;
