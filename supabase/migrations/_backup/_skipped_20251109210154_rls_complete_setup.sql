-- ============================================
-- RLS 完整設定 SQL
-- ============================================
-- 執行方式：複製此檔案全部內容，在 Supabase Dashboard > SQL Editor 執行
-- 網址：https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn

-- ============================================
-- Part 1: 為 Employees 加上 workspace_id
-- ============================================

BEGIN;

-- Step 1.1: 新增 workspace_id 欄位
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS workspace_id text;

COMMENT ON COLUMN public.employees.workspace_id IS '員工所屬分公司 ID（主要歸屬，但可跨公司查看）';

-- Step 1.2: 建立外鍵關聯
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.employees
    ADD CONSTRAINT employees_workspace_id_fkey
    FOREIGN KEY (workspace_id)
    REFERENCES public.workspaces(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Step 1.3: 設定現有員工的預設 workspace
DO $$
DECLARE
  default_workspace_id text;
BEGIN
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NOT NULL THEN
    UPDATE public.employees
    SET workspace_id = default_workspace_id
    WHERE workspace_id IS NULL;

    RAISE NOTICE '✅ 已將所有員工設定為 workspace: %', default_workspace_id;
  ELSE
    RAISE NOTICE '⚠️ 尚未建立 workspace，跳過員工更新';
  END IF;
END $$;

-- Step 1.4: 建立索引
CREATE INDEX IF NOT EXISTS idx_employees_workspace_id
ON public.employees(workspace_id);

COMMIT;

-- ============================================
-- Part 2: 啟用 RLS 資料隔離
-- ============================================

BEGIN;

-- Step 2.1: Helper Function
CREATE OR REPLACE FUNCTION public.set_current_workspace(workspace_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', workspace_id, false);
END;
$$;

COMMENT ON FUNCTION public.set_current_workspace IS '設定當前 workspace ID，在應用程式初始化時呼叫';

-- Step 2.2: 啟用 RLS - 旅遊團相關
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_participants ENABLE ROW LEVEL SECURITY;

-- Step 2.3: 啟用 RLS - 客戶與聯絡人
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Step 2.4: 啟用 RLS - 財務相關
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs ENABLE ROW LEVEL SECURITY;

-- Step 2.5: 啟用 RLS - 合約與報價
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- Step 2.6: 啟用 RLS - 供應商相關
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- Step 2.7: 啟用 RLS - 業務管理
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Step 2.8: 啟用 RLS - 通訊相關
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 2.9: 啟用 RLS - 其他業務資料
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_canvases ENABLE ROW LEVEL SECURITY;

-- Step 2.10: 刪除舊的 Policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Step 2.11: 建立 Workspace Isolation Policies
DO $$
DECLARE
  tables text[] := ARRAY[
    'tours', 'orders', 'itineraries', 'itinerary_items', 'tour_participants',
    'customers', 'contacts',
    'payments', 'refunds', 'receipts', 'finance_requests', 'ledgers', 'linkpay_logs',
    'contracts', 'quotes', 'confirmations',
    'suppliers', 'disbursements',
    'calendar_events', 'tasks', 'todos',
    'channels', 'channel_groups', 'channel_members', 'messages',
    'bulletins', 'esims', 'personal_canvases'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format(
      'CREATE POLICY "workspace_isolation_%s" ON public.%I FOR ALL TO authenticated ' ||
      'USING (workspace_id = current_setting(''app.current_workspace_id'', true)::text) ' ||
      'WITH CHECK (workspace_id = current_setting(''app.current_workspace_id'', true)::text)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Step 2.12: 全域表格 - 禁用 RLS
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- Part 3: 驗證結果
-- ============================================

DO $$
DECLARE
  rls_count INTEGER;
  no_rls_count INTEGER;
  total_employees INTEGER;
  employees_with_workspace INTEGER;
BEGIN
  -- 統計 RLS 狀態
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = true;

  SELECT COUNT(*) INTO no_rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

  -- 統計員工資料
  SELECT COUNT(*) INTO total_employees FROM public.employees;
  SELECT COUNT(*) INTO employees_with_workspace FROM public.employees WHERE workspace_id IS NOT NULL;

  -- 輸出結果
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS 設定完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RLS 狀態：';
  RAISE NOTICE '  • RLS 啟用表格數：%', rls_count;
  RAISE NOTICE '  • RLS 停用表格數：%', no_rls_count;
  RAISE NOTICE '';
  RAISE NOTICE '👥 員工資料：';
  RAISE NOTICE '  • 總員工數：%', total_employees;
  RAISE NOTICE '  • 已設定 workspace：%', employees_with_workspace;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 下一步：';
  RAISE NOTICE '  1. 前往 /settings/workspaces 管理工作空間';
  RAISE NOTICE '  2. 建立台北、台中等分公司';
  RAISE NOTICE '  3. 使用 WorkspaceSwitcher 組件切換分公司';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
