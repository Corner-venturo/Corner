-- ============================================
-- Venturo ID 類型檢查
-- ============================================
-- 目的：檢查所有表格的 ID 和外鍵類型是否一致
-- 日期：2025-10-29
-- ============================================

BEGIN;

-- 檢查 employees 表的 ID 類型
DO $$
DECLARE
  emp_id_type text;
BEGIN
  SELECT data_type INTO emp_id_type
  FROM information_schema.columns
  WHERE table_name = 'employees' AND column_name = 'id';
  
  RAISE NOTICE '📋 employees.id 類型: %', emp_id_type;
END $$;

-- 檢查 todos 表的引用欄位
DO $$
DECLARE
  creator_type text;
  assignee_type text;
BEGIN
  SELECT data_type INTO creator_type
  FROM information_schema.columns
  WHERE table_name = 'todos' AND column_name = 'creator';
  
  SELECT data_type INTO assignee_type
  FROM information_schema.columns
  WHERE table_name = 'todos' AND column_name = 'assignee';
  
  RAISE NOTICE '📋 todos.creator 類型: %', creator_type;
  RAISE NOTICE '📋 todos.assignee 類型: %', assignee_type;
END $$;

-- 檢查 calendar_events 表的引用欄位
DO $$
DECLARE
  owner_type text;
BEGIN
  SELECT data_type INTO owner_type
  FROM information_schema.columns
  WHERE table_name = 'calendar_events' AND column_name = 'owner_id';
  
  RAISE NOTICE '📋 calendar_events.owner_id 類型: %', owner_type;
END $$;

-- 檢查 payment_requests 表的引用欄位
DO $$
DECLARE
  approved_type text;
  paid_type text;
BEGIN
  SELECT data_type INTO approved_type
  FROM information_schema.columns
  WHERE table_name = 'payment_requests' AND column_name = 'approved_by';
  
  SELECT data_type INTO paid_type
  FROM information_schema.columns
  WHERE table_name = 'payment_requests' AND column_name = 'paid_by';
  
  RAISE NOTICE '📋 payment_requests.approved_by 類型: %', approved_type;
  RAISE NOTICE '📋 payment_requests.paid_by 類型: %', paid_type;
END $$;

-- 檢查 messages 表的引用欄位
DO $$
DECLARE
  author_type text;
BEGIN
  SELECT data_type INTO author_type
  FROM information_schema.columns
  WHERE table_name = 'messages' AND column_name = 'author_id';
  
  RAISE NOTICE '📋 messages.author_id 類型: %', author_type;
END $$;

-- 檢查 bulletins 表的引用欄位
DO $$
DECLARE
  author_type text;
BEGIN
  SELECT data_type INTO author_type
  FROM information_schema.columns
  WHERE table_name = 'bulletins' AND column_name = 'author_id';
  
  RAISE NOTICE '📋 bulletins.author_id 類型: %', author_type;
END $$;

COMMIT;

-- ============================================
-- 檢查完成
-- 請查看 NOTICE 輸出以了解當前的類型狀況
-- ============================================
