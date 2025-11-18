-- =====================================================
-- 檢查 NULL workspace_id 的資料
-- 建立日期：2025-11-17
-- 目的：找出 calendar_events 和 todos 中 workspace_id 為 NULL 的資料
-- =====================================================

-- 檢查 calendar_events
SELECT
  'calendar_events' as table_name,
  COUNT(*) as total_rows,
  COUNT(workspace_id) as has_workspace_id,
  COUNT(*) - COUNT(workspace_id) as null_workspace_id
FROM public.calendar_events;

-- 檢查 todos
SELECT
  'todos' as table_name,
  COUNT(*) as total_rows,
  COUNT(workspace_id) as has_workspace_id,
  COUNT(*) - COUNT(workspace_id) as null_workspace_id
FROM public.todos;

-- 列出前 10 筆 workspace_id 為 NULL 的 calendar_events
SELECT
  id,
  title,
  created_at,
  workspace_id
FROM public.calendar_events
WHERE workspace_id IS NULL
LIMIT 10;

-- 列出前 10 筆 workspace_id 為 NULL 的 todos
SELECT
  id,
  title,
  created_at,
  workspace_id
FROM public.todos
WHERE workspace_id IS NULL
LIMIT 10;

-- 檢查其他可能有 NULL workspace_id 的重要表格
SELECT
  'tours' as table_name,
  COUNT(*) - COUNT(workspace_id) as null_count
FROM public.tours
UNION ALL
SELECT
  'orders' as table_name,
  COUNT(*) - COUNT(workspace_id) as null_count
FROM public.orders
UNION ALL
SELECT
  'customers' as table_name,
  COUNT(*) - COUNT(workspace_id) as null_count
FROM public.customers
UNION ALL
SELECT
  'suppliers' as table_name,
  COUNT(*) - COUNT(workspace_id) as null_count
FROM public.suppliers
UNION ALL
SELECT
  'quotes' as table_name,
  COUNT(*) - COUNT(workspace_id) as null_count
FROM public.quotes
UNION ALL
SELECT
  'payments' as table_name,
  COUNT(*) - COUNT(workspace_id) as null_count
FROM public.payments;
