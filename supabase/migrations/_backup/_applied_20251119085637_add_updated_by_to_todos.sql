-- 新增 updated_by 欄位到 todos 資料表
BEGIN;

-- 新增欄位
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 新增註解
COMMENT ON COLUMN public.todos.updated_by IS 'Last user who updated this todo';

-- 更新現有資料：使用 created_by 作為預設值
UPDATE public.todos
SET updated_by = created_by
WHERE updated_by IS NULL;

COMMIT;
