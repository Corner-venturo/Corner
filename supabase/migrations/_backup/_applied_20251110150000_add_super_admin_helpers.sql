-- =====================================================
-- 修改 RLS Helper Functions 支援 super_admin
-- =====================================================
-- 目的：
-- 1. 新增 is_super_admin() 判斷是否為超級管理員
-- 2. 修改現有 helper functions 支援 super_admin
-- 3. 確保權限層級：super_admin > admin > 一般員工
-- =====================================================

BEGIN;

-- =====================================================
-- 1. 新增 is_super_admin() 函數
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_permissions text[];
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.user_roles
  WHERE user_id = auth.uid();

  -- 檢查是否包含 'super_admin' 權限
  RETURN user_permissions @> ARRAY['super_admin']::text[];
END;
$$;

COMMENT ON FUNCTION public.is_super_admin() IS
'檢查當前使用者是否為超級管理員（工程等級，可跨辦公室操作）';

-- =====================================================
-- 2. 修改 is_admin() 函數（保持向下相容）
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_permissions text[];
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.user_roles
  WHERE user_id = auth.uid();

  -- super_admin 也算 admin（包含所有 admin 權限）
  RETURN user_permissions @> ARRAY['super_admin']::text[]
      OR user_permissions @> ARRAY['admin']::text[];
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
'檢查當前使用者是否為管理員（包含 super_admin 和 admin）';

-- =====================================================
-- 3. 新增 can_manage_workspace() 函數
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_manage_workspace(target_workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_workspace_id uuid;
  user_permissions text[];
BEGIN
  -- super_admin 可以管理任何 workspace
  IF is_super_admin() THEN
    RETURN true;
  END IF;

  -- 一般 admin 只能管理自己的 workspace
  SELECT workspace_id, permissions INTO user_workspace_id, user_permissions
  FROM public.employees
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN user_permissions @> ARRAY['admin']::text[]
     AND user_workspace_id = target_workspace_id;
END;
$$;

COMMENT ON FUNCTION public.can_manage_workspace(uuid) IS
'檢查當前使用者是否可以管理指定的 workspace（super_admin 可管理所有，admin 只能管理自己的）';

-- =====================================================
-- 4. 修改 get_current_user_workspace() 支援 super_admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_user_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_workspace_id uuid;
BEGIN
  -- super_admin 不綁定特定 workspace，返回 NULL
  -- 前端需要讓 super_admin 選擇要操作的 workspace
  IF is_super_admin() THEN
    RETURN NULL;
  END IF;

  SELECT workspace_id INTO user_workspace_id
  FROM public.employees
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN user_workspace_id;
END;
$$;

COMMENT ON FUNCTION public.get_current_user_workspace() IS
'取得當前使用者的 workspace_id（super_admin 返回 NULL，需由前端指定）';

-- =====================================================
-- 5. 新增權限檢查輔助函數
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_permission(permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_permissions text[];
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.user_roles
  WHERE user_id = auth.uid();

  -- super_admin 擁有所有權限
  IF user_permissions @> ARRAY['super_admin']::text[] THEN
    RETURN true;
  END IF;

  -- 檢查是否有指定權限
  RETURN user_permissions @> ARRAY[permission_name]::text[];
END;
$$;

COMMENT ON FUNCTION public.has_permission(text) IS
'檢查當前使用者是否擁有指定權限（super_admin 自動擁有所有權限）';

COMMIT;
