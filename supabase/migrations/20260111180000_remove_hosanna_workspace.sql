-- 刪除 hosanna workspace 及其相關資料
BEGIN;

-- 先刪除員工
DELETE FROM public.employees WHERE workspace_id = (
  SELECT id FROM public.workspaces WHERE code = 'hosanna'
);

-- 再刪除 workspace
DELETE FROM public.workspaces WHERE code = 'hosanna';

COMMIT;
