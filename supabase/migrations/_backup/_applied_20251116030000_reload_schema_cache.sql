-- 重新載入 PostgREST schema cache
-- 這會強制 Supabase 重新讀取 todos 表格的結構

BEGIN;

-- 通知 PostgREST 重新載入 schema
NOTIFY pgrst, 'reload schema';

-- 確認 todos 表格沒有 description 欄位
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'todos'
    AND column_name = 'description'
  ) THEN
    -- 如果存在 description 欄位，刪除它
    ALTER TABLE public.todos DROP COLUMN description;
    RAISE NOTICE 'Dropped description column from todos table';
  ELSE
    RAISE NOTICE 'No description column found in todos table (correct)';
  END IF;
END $$;

COMMIT;
