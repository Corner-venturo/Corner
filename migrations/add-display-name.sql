-- ============================================
-- Migration: 新增 display_name 欄位到 employees 表
-- 日期: 2025-01-22
-- 說明: 統一使用 display_name 作為顯示名稱，保留 chinese_name 向後相容
-- ============================================

-- 1. 新增 display_name 欄位
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- 2. 將現有的 chinese_name 資料複製到 display_name
UPDATE employees
SET display_name = chinese_name
WHERE display_name IS NULL;

-- 3. 設定 display_name 為 NOT NULL（確保所有資料都有值後再執行）
-- ALTER TABLE employees
-- ALTER COLUMN display_name SET NOT NULL;

-- 完成！
SELECT
  id,
  employee_number,
  english_name,
  chinese_name,
  display_name
FROM employees
LIMIT 5;
