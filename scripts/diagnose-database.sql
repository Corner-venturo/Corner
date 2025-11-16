-- Venturo 資料庫完整診斷腳本
-- 檢查所有核心表格的狀態、RLS、workspace_id 等

\echo '========================================='
\echo 'Venturo 資料庫健康檢查'
\echo '========================================='
\echo ''

-- 1. 檢查所有表格是否存在
\echo '1. 核心表格存在性檢查'
\echo '---'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN '✅'
    ELSE '❌'
  END || ' employees' AS status
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') THEN '✅' ELSE '❌' END || ' workspaces'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channels') THEN '✅' ELSE '❌' END || ' channels'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN '✅' ELSE '❌' END || ' messages'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todos') THEN '✅' ELSE '❌' END || ' todos'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tours') THEN '✅' ELSE '❌' END || ' tours'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN '✅' ELSE '❌' END || ' orders'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN '✅' ELSE '❌' END || ' quotes'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itineraries') THEN '✅' ELSE '❌' END || ' itineraries'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN '✅' ELSE '❌' END || ' customers'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN '✅' ELSE '❌' END || ' calendar_events';

\echo ''
\echo '2. RLS 狀態檢查'
\echo '---'
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '🔓 DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'employees', 'workspaces', 'channels', 'channel_members', 'messages',
    'todos', 'tours', 'orders', 'quotes', 'itineraries', 'customers', 'calendar_events'
  )
ORDER BY tablename;

\echo ''
\echo '3. workspace_id 欄位檢查'
\echo '---'
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'workspace_id'
  AND table_name IN (
    'employees', 'channels', 'channel_members', 'messages',
    'todos', 'tours', 'orders', 'quotes', 'itineraries', 'customers', 'calendar_events'
  )
ORDER BY table_name;

\echo ''
\echo '4. workspace_id NULL 值檢查'
\echo '---'
DO $$
DECLARE
  tables text[] := ARRAY['employees', 'channels', 'tours', 'orders', 'quotes', 'itineraries', 'customers'];
  tbl text;
  null_count integer;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE workspace_id IS NULL', tbl) INTO null_count;
    IF null_count > 0 THEN
      RAISE NOTICE '❌ %: % 筆資料缺少 workspace_id', tbl, null_count;
    ELSE
      RAISE NOTICE '✅ %: 所有資料都有 workspace_id', tbl;
    END IF;
  END LOOP;
END $$;

\echo ''
\echo '5. RLS Helper Functions 檢查'
\echo '---'
SELECT
  proname AS function_name,
  CASE
    WHEN prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '⚠️ SECURITY INVOKER'
  END AS security_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('get_user_workspace_id', 'is_super_admin')
ORDER BY proname;

\echo ''
\echo '6. RLS Policies 統計'
\echo '---'
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'channels', 'channel_members', 'messages',
    'todos', 'tours', 'orders', 'quotes', 'itineraries', 'customers', 'calendar_events'
  )
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '7. Workspaces 資料檢查'
\echo '---'
SELECT
  id,
  name,
  code,
  created_at
FROM workspaces
ORDER BY created_at;

\echo ''
\echo '8. Employees workspace_id 分佈'
\echo '---'
SELECT
  w.name AS workspace_name,
  COUNT(e.id) AS employee_count
FROM employees e
LEFT JOIN workspaces w ON w.id = e.workspace_id
GROUP BY w.name, w.id
ORDER BY w.created_at;

\echo ''
\echo '========================================='
\echo '診斷完成！'
\echo '========================================='
