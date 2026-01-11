-- ============================================
-- 修復員工可見性問題
-- 確保所有公司的員工都能互相看到
-- ============================================

BEGIN;

-- 暫時禁用 employees 的 RLS（開發階段）
-- 讓所有員工都可以看到所有同事
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- 確保所有員工都有 workspace_id
UPDATE public.employees
SET workspace_id = (
  SELECT id FROM public.workspaces WHERE code = 'corner' LIMIT 1
)
WHERE workspace_id IS NULL;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 員工可見性已修復';
  RAISE NOTICE '  - RLS 已禁用（開發階段）';
  RAISE NOTICE '  - NULL workspace_id 已設為 corner';
  RAISE NOTICE '========================================';
END $$;
