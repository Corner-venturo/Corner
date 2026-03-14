-- 回滾 is_from_core 欄位（不需要，核心表本來就是唯一真相）
-- 日期：2026-03-14

-- 移除索引
DROP INDEX IF EXISTS idx_tour_requests_tour_from_core;
DROP INDEX IF EXISTS idx_tour_requests_is_from_core;

-- 移除欄位
ALTER TABLE public.tour_requests DROP COLUMN IF EXISTS is_from_core;
