-- 禁用 todos 表格的 RLS
-- Venturo 是內部管理系統，所有已認證用戶都應該能訪問所有數據

BEGIN;

-- 禁用 RLS
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;

-- 刪除所有現有的 RLS 策略（如果有）
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'todos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.todos', policy_record.policyname);
    END LOOP;
END $$;

COMMIT;
