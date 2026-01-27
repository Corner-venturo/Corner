-- ============================================
-- 移除勁陽旅行社 (JY) 測試資料
-- ============================================

BEGIN;

-- 1. 找到 JY workspace ID
DO $$
DECLARE
  jy_workspace_id uuid;
  jy_employee_id uuid;
  jy_supabase_user_id uuid;
BEGIN
  -- 找 JY workspace
  SELECT id INTO jy_workspace_id
  FROM public.workspaces
  WHERE code = 'JY';

  IF jy_workspace_id IS NULL THEN
    RAISE NOTICE '⚠️ 找不到 JY workspace，跳過';
    RETURN;
  END IF;

  RAISE NOTICE '🔍 找到 JY workspace: %', jy_workspace_id;

  -- 找 JY 員工
  SELECT id, supabase_user_id INTO jy_employee_id, jy_supabase_user_id
  FROM public.employees
  WHERE workspace_id = jy_workspace_id
  LIMIT 1;

  IF jy_employee_id IS NOT NULL THEN
    RAISE NOTICE '🔍 找到 JY 員工: %', jy_employee_id;

    -- 刪除 JY 員工
    DELETE FROM public.employees WHERE workspace_id = jy_workspace_id;
    RAISE NOTICE '✅ 已刪除 JY 員工';
  END IF;

  -- 刪除 JY 相關的 user_roles
  DELETE FROM public.user_roles WHERE user_id = jy_supabase_user_id;
  RAISE NOTICE '✅ 已刪除 JY user_roles';

  -- 刪除 JY workspace
  DELETE FROM public.workspaces WHERE id = jy_workspace_id;
  RAISE NOTICE '✅ 已刪除 JY workspace';

  -- 注意：auth.users 需要用 admin API 刪除，這裡無法直接刪除
  IF jy_supabase_user_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ 需要手動刪除 auth.users 記錄:';
    RAISE NOTICE '   User ID: %', jy_supabase_user_id;
    RAISE NOTICE '   請到 Supabase Dashboard → Authentication → Users 刪除';
  END IF;

END $$;

COMMIT;

-- 還原 tours RLS 為正常模式
DROP POLICY IF EXISTS "tours_select" ON public.tours;
DROP POLICY IF EXISTS "tours_select" ON public.tours;
CREATE POLICY "tours_select" ON public.tours FOR SELECT
USING (
  is_super_admin()
  OR (get_current_user_workspace() IS NOT NULL AND workspace_id = get_current_user_workspace())
);

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ JY 資料清理完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已刪除:';
  RAISE NOTICE '  • JY workspace';
  RAISE NOTICE '  • JY 員工';
  RAISE NOTICE '  • JY user_roles';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ 待手動處理:';
  RAISE NOTICE '  • Supabase Dashboard 刪除 auth.users';
  RAISE NOTICE '========================================';
END $$;
