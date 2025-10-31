-- ============================================
-- 💾 資料備份腳本
-- ============================================
-- 目的：在重建 schema 前備份所有資料
-- 執行方式：在 Supabase SQL Editor 執行，複製結果
-- ============================================

-- ============================================
-- Part 1: 備份 Todos
-- ============================================

-- 匯出所有 todos 資料（JSON 格式）
SELECT
  '📦 Todos 備份資料' as backup_type,
  jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'description', description,
      'status', status,
      'priority', priority,
      'due_date', due_date,
      'creator', creator,
      'assignee', assignee,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) as data,
  COUNT(*) as total_records
FROM todos
WHERE _deleted IS NOT TRUE;

-- ============================================
-- Part 2: 備份 Calendar Events
-- ============================================

SELECT
  '📦 Calendar Events 備份資料' as backup_type,
  jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'description', description,
      'start_time', start_time,
      'end_time', end_time,
      'event_type', event_type,
      'location', location,
      'created_by', created_by,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) as data,
  COUNT(*) as total_records
FROM calendar_events
WHERE _deleted IS NOT TRUE;

-- ============================================
-- Part 3: 備份 Payment Requests
-- ============================================

SELECT
  '📦 Payment Requests 備份資料' as backup_type,
  jsonb_agg(
    jsonb_build_object(
      'id', id,
      'amount', amount,
      'currency', currency,
      'purpose', purpose,
      'status', status,
      'payment_date', payment_date,
      'requester', requester,
      'approved_by', approved_by,
      'paid_by', paid_by,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) as data,
  COUNT(*) as total_records
FROM payment_requests
WHERE _deleted IS NOT TRUE;

-- ============================================
-- Part 4: 備份統計
-- ============================================

SELECT
  '📊 備份統計' as info,
  (SELECT COUNT(*) FROM todos WHERE _deleted IS NOT TRUE) as todos_count,
  (SELECT COUNT(*) FROM calendar_events WHERE _deleted IS NOT TRUE) as calendar_events_count,
  (SELECT COUNT(*) FROM payment_requests WHERE _deleted IS NOT TRUE) as payment_requests_count;

-- ============================================
-- 重要提醒
-- ============================================

SELECT
  '⚠️ 重要提醒' as warning,
  '請將上面的 JSON 資料複製到安全的地方' as step1,
  '確認備份完成後，才執行 00_complete_schema_rebuild.sql' as step2,
  '最後執行 restore_all_data.sql 還原資料' as step3;
