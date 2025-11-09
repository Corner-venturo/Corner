-- ============================================
-- 完整的 Workspace RLS 設定
-- ============================================
-- 目的：為所有業務資料表格啟用 RLS，實現多公司資料隔離
-- 適用場景：台北公司 vs 台中分公司
-- 策略：使用 app.current_workspace_id 進行資料隔離

BEGIN;

-- ============================================
-- Helper Function: 設定當前 workspace
-- ============================================

CREATE OR REPLACE FUNCTION public.set_current_workspace(workspace_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', workspace_id, false);
END;
$$;

COMMENT ON FUNCTION public.set_current_workspace IS '設定當前使用者的 workspace_id，用於 RLS 過濾';

-- ============================================
-- 啟用 RLS - 核心業務表格
-- ============================================

-- 旅遊團相關
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_participants ENABLE ROW LEVEL SECURITY;

-- 客戶與聯絡人
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 財務相關
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs ENABLE ROW LEVEL SECURITY;

-- 合約與報價
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- 供應商相關
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- 業務管理
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 通訊相關
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 其他業務資料
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_canvases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 刪除舊的 Policies
-- ============================================

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

-- ============================================
-- 建立 Workspace Isolation Policies
-- ============================================

-- 宏函數：為表格建立標準 RLS policy
CREATE OR REPLACE FUNCTION create_workspace_policy(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'CREATE POLICY "workspace_isolation_%s" ON public.%I FOR ALL TO authenticated ' ||
    'USING (workspace_id = current_setting(''app.current_workspace_id'', true)::text) ' ||
    'WITH CHECK (workspace_id = current_setting(''app.current_workspace_id'', true)::text)',
    table_name, table_name
  );
END;
$$;

-- 應用到所有表格
SELECT create_workspace_policy('tours');
SELECT create_workspace_policy('orders');
SELECT create_workspace_policy('itineraries');
SELECT create_workspace_policy('itinerary_items');
SELECT create_workspace_policy('tour_participants');
SELECT create_workspace_policy('customers');
SELECT create_workspace_policy('contacts');
SELECT create_workspace_policy('payments');
SELECT create_workspace_policy('refunds');
SELECT create_workspace_policy('receipts');
SELECT create_workspace_policy('finance_requests');
SELECT create_workspace_policy('ledgers');
SELECT create_workspace_policy('linkpay_logs');
SELECT create_workspace_policy('contracts');
SELECT create_workspace_policy('quotes');
SELECT create_workspace_policy('confirmations');
SELECT create_workspace_policy('suppliers');
SELECT create_workspace_policy('disbursements');
SELECT create_workspace_policy('calendar_events');
SELECT create_workspace_policy('tasks');
SELECT create_workspace_policy('todos');
SELECT create_workspace_policy('channels');
SELECT create_workspace_policy('channel_groups');
SELECT create_workspace_policy('channel_members');
SELECT create_workspace_policy('messages');
SELECT create_workspace_policy('bulletins');
SELECT create_workspace_policy('esims');
SELECT create_workspace_policy('personal_canvases');

-- 清理輔助函數
DROP FUNCTION create_workspace_policy;

-- ============================================
-- 全域表格 - 不需要 RLS（跨 workspace 共享）
-- ============================================

-- 這些表格保持 DISABLE RLS，因為需要跨 workspace 訪問：
-- - workspaces (workspace 主表)
-- - employees (員工可能跨 workspace 調動)
-- - user_roles (權限管理)
-- - destinations (目的地主檔)
-- - airlines (航空公司主檔)
-- - hotels (飯店主檔)

ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 驗證 RLS 狀態
-- ============================================

DO $$
DECLARE
  rls_count INTEGER;
  no_rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = true;

  SELECT COUNT(*) INTO no_rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

  RAISE NOTICE '✅ RLS 啟用表格數：%', rls_count;
  RAISE NOTICE '⚪ RLS 停用表格數：%', no_rls_count;
END $$;

COMMIT;

-- ============================================
-- 使用說明
-- ============================================

COMMENT ON FUNCTION public.set_current_workspace IS
'設定當前 workspace ID，在應用程式初始化時呼叫：
-- 範例：SELECT set_current_workspace(''taipei'');
-- 之後所有查詢會自動過濾該 workspace 的資料';
