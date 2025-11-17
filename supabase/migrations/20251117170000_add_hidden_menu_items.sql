-- =====================================================
-- 新增員工自訂選單顯示功能
-- 建立日期：2025-01-17
-- 說明：允許員工自訂側邊欄顯示的功能選單
-- =====================================================

BEGIN;

-- 新增 hidden_menu_items 欄位到 employees 表格
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS hidden_menu_items TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.employees.hidden_menu_items IS '使用者隱藏的選單項目 ID（例如：["tours", "quotes", "accounting"]）';

-- 建立索引（方便查詢）
CREATE INDEX IF NOT EXISTS idx_employees_hidden_menu_items
ON public.employees USING GIN(hidden_menu_items);

COMMIT;
