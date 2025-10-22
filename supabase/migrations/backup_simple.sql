-- ============================================
-- 💾 簡化備份腳本
-- ============================================
-- 只查詢存在的欄位
-- ============================================

-- 先看看 todos 有多少筆資料
SELECT COUNT(*) as total_todos FROM todos;

-- 備份所有 todos（所有欄位）
SELECT * FROM todos ORDER BY created_at;

-- 備份所有 calendar_events（如果有）
SELECT COUNT(*) as total_calendar_events FROM calendar_events;
SELECT * FROM calendar_events ORDER BY created_at LIMIT 10;

-- 備份所有 payment_requests（如果有）
SELECT COUNT(*) as total_payment_requests FROM payment_requests;
SELECT * FROM payment_requests ORDER BY created_at LIMIT 10;
