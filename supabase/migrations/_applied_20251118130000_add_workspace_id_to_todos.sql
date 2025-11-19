-- 為 todos 表格更新 workspace_id
-- 使待辦事項支援多租戶隔離

BEGIN;

-- 1. 檢查並為現有資料填入 workspace_id（從 employees 表的 creator 取得）
UPDATE public.todos t
SET workspace_id = e.workspace_id
FROM public.employees e
WHERE t.creator = e.id
  AND t.workspace_id IS NULL;

-- 2. 如果還有 NULL 的，設定為第一個 workspace（避免 NOT NULL 錯誤）
UPDATE public.todos
SET workspace_id = (SELECT id FROM public.workspaces LIMIT 1)
WHERE workspace_id IS NULL;

-- 3. 設定為 NOT NULL（確保所有新資料都有 workspace_id）
ALTER TABLE public.todos
ALTER COLUMN workspace_id SET NOT NULL;

-- 4. 建立索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON public.todos(workspace_id);

-- 5. 更新註解
COMMENT ON COLUMN public.todos.workspace_id IS '所屬工作空間 ID（多租戶隔離）';

COMMIT;
