-- =====================================================
-- 檢查所有表格的 RLS 狀態
-- 建立日期：2025-11-17
-- 目的：確認所有表格都已禁用 RLS
-- =====================================================

-- 查詢所有 public schema 的表格 RLS 狀態
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 如果有任何表格 rls_enabled = true，則需要禁用
-- 下面是禁用所有表格 RLS 的 SQL（確保執行）

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

-- 再次確認
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '❌ 已啟用'
    ELSE '✅ 已禁用'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
