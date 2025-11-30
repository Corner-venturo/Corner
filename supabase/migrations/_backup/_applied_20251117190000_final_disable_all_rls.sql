-- =====================================================
-- 最終禁用所有表格的 RLS
-- 建立日期：2025-11-17
-- 目的：確認並強制禁用所有 public schema 表格的 RLS
-- =====================================================

BEGIN;

-- 禁用所有表格的 RLS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Disabled RLS for table: %', r.tablename;
  END LOOP;
END $$;

-- 驗證結果
DO $$
DECLARE
  rls_enabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;

  IF rls_enabled_count > 0 THEN
    RAISE WARNING 'Still have % tables with RLS enabled!', rls_enabled_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All tables have RLS disabled ✅';
  END IF;
END $$;

COMMIT;
