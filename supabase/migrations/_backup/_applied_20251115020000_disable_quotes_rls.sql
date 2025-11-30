-- 禁用 quotes 表格的 RLS
-- 與 channels 相同，暫時禁用 RLS 直到 Auth 系統完整實作

BEGIN;

-- 禁用 quotes 表格的 RLS
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;

-- 刪除所有現有的 RLS 政策（如果有的話）
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'quotes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quotes', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

COMMIT;
