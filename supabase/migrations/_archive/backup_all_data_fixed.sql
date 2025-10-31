-- ============================================
-- 💾 資料備份腳本（修正版）
-- ============================================
-- 目的：根據實際表結構備份所有資料
-- ============================================

-- ============================================
-- Part 1: 備份 Todos
-- ============================================

SELECT
  '📦 Todos 備份' as backup_type,
  id,
  title,
  priority,
  deadline,
  status,
  completed,
  creator,
  assignee,
  visibility,
  related_items,
  sub_tasks,
  notes,
  enabled_quick_actions,
  needs_creator_notification,
  created_at,
  updated_at,
  _deleted,
  _needs_sync,
  _synced_at
FROM todos
WHERE _deleted IS NOT TRUE OR _deleted IS NULL
ORDER BY created_at;

-- ============================================
-- Part 2: 備份 Calendar Events
-- ============================================

SELECT
  '📅 Calendar Events 備份' as backup_type,
  id,
  title,
  description,
  start,
  "end",
  all_day,
  type,
  color,
  visibility,
  related_tour_id,
  related_order_id,
  attendees,
  reminder_minutes,
  recurring,
  recurring_until,
  owner_id,
  created_at,
  updated_at,
  _deleted,
  _needs_sync,
  _synced_at
FROM calendar_events
WHERE _deleted IS NOT TRUE OR _deleted IS NULL
ORDER BY created_at;

-- ============================================
-- Part 3: 備份 Payment Requests
-- ============================================

SELECT
  '💰 Payment Requests 備份' as backup_type,
  id,
  code,
  tour_id,
  request_type,
  amount,
  supplier_id,
  supplier_name,
  status,
  approved_by,
  approved_at,
  paid_by,
  paid_at,
  notes,
  created_at,
  updated_at
FROM payment_requests
ORDER BY created_at;

-- ============================================
-- Part 4: 備份統計
-- ============================================

SELECT
  '📊 備份統計' as info,
  (SELECT COUNT(*) FROM todos WHERE _deleted IS NOT TRUE OR _deleted IS NULL) as todos_count,
  (SELECT COUNT(*) FROM calendar_events WHERE _deleted IS NOT TRUE OR _deleted IS NULL) as calendar_events_count,
  (SELECT COUNT(*) FROM payment_requests) as payment_requests_count;

-- ============================================
-- 重要提醒
-- ============================================

SELECT
  '⚠️ 重要' as warning,
  '請將查詢結果複製到文字檔保存' as step1,
  '特別是 Todos 的 21 筆資料' as step2,
  '確認備份後再執行重建 SQL' as step3;
