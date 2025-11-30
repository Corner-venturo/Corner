-- ============================================================
-- Helper Functions for RLS
-- ============================================================

-- 1. 取得當前使用者的 workspace_id
CREATE OR REPLACE FUNCTION public.get_current_user_workspace()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  workspace_id uuid;
BEGIN
  SELECT e.workspace_id INTO workspace_id
  FROM public.employees e
  WHERE e.user_id = auth.uid();
  
  RETURN workspace_id;
END;
$$;

COMMENT ON FUNCTION public.get_current_user_workspace() IS '取得當前登入使用者的 workspace_id';

-- 2. 檢查是否為管理者
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  admin_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) INTO admin_role;
  
  RETURN COALESCE(admin_role, false);
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS '檢查當前使用者是否為管理者';

-- 3. 取得當前員工 ID
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  emp_id uuid;
BEGIN
  SELECT e.id INTO emp_id
  FROM public.employees e
  WHERE e.user_id = auth.uid();
  
  RETURN emp_id;
END;
$$;

COMMENT ON FUNCTION public.get_current_employee_id() IS '取得當前登入使用者的 employee ID';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Helper Functions 建立完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '已建立的函數：';
  RAISE NOTICE '  - get_current_user_workspace()';
  RAISE NOTICE '  - is_admin()';
  RAISE NOTICE '  - get_current_employee_id()';
  RAISE NOTICE '';
END $$;
