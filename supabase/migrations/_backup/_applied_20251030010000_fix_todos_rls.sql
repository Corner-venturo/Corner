-- Fix todos table RLS policy
-- 修正待辦事項表格的 RLS 策略

BEGIN;

-- 確保 todos 表格存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'todos') THEN
        RAISE NOTICE 'todos table does not exist, skipping RLS setup';
    ELSE
        -- 禁用 RLS（內部系統，所有認證用戶都可訪問）
        ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'todos RLS disabled successfully';
    END IF;
END $$;

COMMIT;
