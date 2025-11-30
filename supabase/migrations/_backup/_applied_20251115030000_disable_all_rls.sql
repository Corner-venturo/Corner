-- 禁用所有核心表格的 RLS
-- Venturo 是內部管理系統，在 Auth 系統完整實作前暫時禁用 RLS

BEGIN;

-- 禁用 todos 表格的 RLS
ALTER TABLE IF EXISTS public.todos DISABLE ROW LEVEL SECURITY;

-- 刪除 todos 的所有 RLS 政策
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'todos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.todos', policy_record.policyname);
    RAISE NOTICE 'Dropped todos policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- 禁用 calendar_events 表格的 RLS
ALTER TABLE IF EXISTS public.calendar_events DISABLE ROW LEVEL SECURITY;

-- 刪除 calendar_events 的所有 RLS 政策
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'calendar_events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.calendar_events', policy_record.policyname);
    RAISE NOTICE 'Dropped calendar_events policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- 禁用 customers 表格的 RLS（預防性）
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;

-- 刪除 customers 的所有 RLS 政策
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', policy_record.policyname);
    RAISE NOTICE 'Dropped customers policy: %', policy_record.policyname;
  END LOOP;
END $$;

COMMIT;
