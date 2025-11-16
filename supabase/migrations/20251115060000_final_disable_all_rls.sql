-- 最終決定：Venturo 完全不使用 RLS
-- 原因：
-- 1. 內部管理系統，使用 permissions 欄位控制權限
-- 2. 領隊權限透過前端邏輯處理（filter: tour_leader_id）
-- 3. Workspace 隔離透過前端 filter 處理
-- 4. 簡化架構，提升開發效率

BEGIN;

-- ============================================
-- 第一步：禁用所有核心表格的 RLS
-- ============================================

-- 系統表
ALTER TABLE IF EXISTS public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;

-- Workspace 相關
ALTER TABLE IF EXISTS public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;

-- 核心業務
ALTER TABLE IF EXISTS public.tours DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itineraries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;

-- 財務
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_requests DISABLE ROW LEVEL SECURITY;

-- 其他
ALTER TABLE IF EXISTS public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.esims DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts DISABLE ROW LEVEL SECURITY;

-- 輔助表
ALTER TABLE IF EXISTS public.cost_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.price_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_codes DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 第二步：刪除所有 RLS Policies
-- ============================================

DO $$
DECLARE
  policy_record RECORD;
  table_count INTEGER := 0;
  policy_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🗑️ 開始刪除所有 RLS policies...';

  -- 遍歷所有表格的所有 policies
  FOR policy_record IN
    SELECT
      schemaname,
      tablename,
      policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        policy_record.policyname,
        policy_record.schemaname,
        policy_record.tablename
      );

      policy_count := policy_count + 1;

      RAISE NOTICE '  ✓ Dropped: %.% - %',
        policy_record.tablename,
        policy_record.policyname,
        policy_count;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ✗ Failed to drop policy: %.%',
        policy_record.tablename,
        policy_record.policyname;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '📊 總共刪除了 % 個 RLS policies', policy_count;

END $$;

-- ============================================
-- 第三步：記錄完成狀態
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS 完全禁用完成！';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Venturo 權限控制架構：';
  RAISE NOTICE '  1. Supabase Auth - 登入驗證';
  RAISE NOTICE '  2. employees.permissions - 功能權限控制';
  RAISE NOTICE '  3. employees.workspace_id - 資料隔離（前端 filter）';
  RAISE NOTICE '  4. user.roles - 角色標籤（admin, tour_leader 等）';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 領隊權限處理：';
  RAISE NOTICE '  - 前端根據 user.roles 判斷';
  RAISE NOTICE '  - 領隊只顯示 tour_leader_id = user.id 的訂單';
  RAISE NOTICE '  - 一般員工顯示整個 workspace 的訂單';
  RAISE NOTICE '';
END $$;

COMMIT;
