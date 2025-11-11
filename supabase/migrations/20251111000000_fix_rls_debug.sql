-- ============================================================
-- 診斷和修復 RLS 問題
-- ============================================================

BEGIN;

-- ============================================================
-- 1. 確保 Helper Functions 存在且正確
-- ============================================================

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

-- ============================================================
-- 2. 確保所有員工都有 workspace_id
-- ============================================================

-- 找出預設的 workspace（應該只有一個）
DO $$
DECLARE
  default_workspace_id uuid;
  affected_count int;
BEGIN
  -- 取得第一個 workspace 作為預設
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NOT NULL THEN
    -- 更新所有沒有 workspace_id 的員工
    UPDATE public.employees
    SET workspace_id = default_workspace_id
    WHERE workspace_id IS NULL;

    GET DIAGNOSTICS affected_count = ROW_COUNT;

    IF affected_count > 0 THEN
      RAISE NOTICE '已修復 % 個員工的 workspace_id', affected_count;
    ELSE
      RAISE NOTICE '所有員工都已有 workspace_id';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ 找不到任何 workspace，請先建立 workspace';
  END IF;
END $$;

-- ============================================================
-- 3. 檢查並顯示目前的資料狀態
-- ============================================================

DO $$
DECLARE
  workspace_count int;
  employee_count int;
  employee_no_workspace int;
  tours_count int;
  orders_count int;
BEGIN
  SELECT COUNT(*) INTO workspace_count FROM public.workspaces;
  SELECT COUNT(*) INTO employee_count FROM public.employees;
  SELECT COUNT(*) INTO employee_no_workspace FROM public.employees WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO tours_count FROM public.tours;
  SELECT COUNT(*) INTO orders_count FROM public.orders;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '📊 資料庫現況';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Workspaces: %', workspace_count;
  RAISE NOTICE 'Employees: % (無 workspace: %)', employee_count, employee_no_workspace;
  RAISE NOTICE 'Tours: %', tours_count;
  RAISE NOTICE 'Orders: %', orders_count;
  RAISE NOTICE '';
END $$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ RLS 診斷與修復完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '如果你還是看不到資料，請檢查：';
  RAISE NOTICE '1. 你的帳號是否在 employees 表格中';
  RAISE NOTICE '2. 你的 employee 記錄是否有 workspace_id';
  RAISE NOTICE '3. 你的 workspace_id 和資料的 workspace_id 是否相同';
  RAISE NOTICE '';
END $$;
