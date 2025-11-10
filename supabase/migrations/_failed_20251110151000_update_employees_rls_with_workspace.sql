-- =====================================================
-- 更新 employees RLS Policy（支援 workspace 分離）
-- =====================================================
-- 目的：
-- 1. super_admin 可以建立任何 workspace 的員工
-- 2. 台北 admin 只能建立台北員工
-- 3. 台中 admin 只能建立台中員工
-- =====================================================

BEGIN;

-- =====================================================
-- 1. 刪除舊的 employees INSERT policy
-- =====================================================

DROP POLICY IF EXISTS "employees_insert" ON public.employees;

-- =====================================================
-- 2. 建立新的 employees INSERT policy（支援 workspace 分離）
-- =====================================================

CREATE POLICY "employees_insert" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (
  -- super_admin 可以建立任何 workspace 的員工
  is_super_admin()
  OR
  -- 一般 admin 只能建立自己 workspace 的員工
  (
    is_admin()
    AND workspace_id = get_current_user_workspace()
  )
);

COMMENT ON POLICY "employees_insert" ON public.employees IS
'員工建立權限：super_admin 可建立任何辦公室員工，一般 admin 只能建立自己辦公室的員工';

-- =====================================================
-- 3. 更新 employees UPDATE policy（同樣邏輯）
-- =====================================================

DROP POLICY IF EXISTS "employees_update" ON public.employees;

CREATE POLICY "employees_update" ON public.employees
FOR UPDATE TO authenticated
USING (
  -- super_admin 可以編輯任何 workspace 的員工
  is_super_admin()
  OR
  -- 一般 admin 只能編輯自己 workspace 的員工
  (
    is_admin()
    AND workspace_id = get_current_user_workspace()
  )
  OR
  -- 員工可以編輯自己的資料
  user_id = auth.uid()
)
WITH CHECK (
  -- super_admin 可以更新任何 workspace 的員工
  is_super_admin()
  OR
  -- 一般 admin 只能更新自己 workspace 的員工
  (
    is_admin()
    AND workspace_id = get_current_user_workspace()
  )
  OR
  -- 員工可以更新自己的資料
  user_id = auth.uid()
);

COMMENT ON POLICY "employees_update" ON public.employees IS
'員工更新權限：super_admin 可編輯任何辦公室員工，一般 admin 只能編輯自己辦公室的員工，員工可編輯自己';

-- =====================================================
-- 4. 更新 employees DELETE policy
-- =====================================================

DROP POLICY IF EXISTS "employees_delete" ON public.employees;

CREATE POLICY "employees_delete" ON public.employees
FOR DELETE TO authenticated
USING (
  -- super_admin 可以刪除任何 workspace 的員工
  is_super_admin()
  OR
  -- 一般 admin 只能刪除自己 workspace 的員工
  (
    is_admin()
    AND workspace_id = get_current_user_workspace()
  )
);

COMMENT ON POLICY "employees_delete" ON public.employees IS
'員工刪除權限：super_admin 可刪除任何辦公室員工，一般 admin 只能刪除自己辦公室的員工';

-- =====================================================
-- 5. employees SELECT policy 保持不變（可看到所有同 workspace）
-- =====================================================

-- 已存在的 SELECT policy 應該是：
-- CREATE POLICY "employees_select" ON public.employees
-- FOR SELECT TO authenticated
-- USING (
--   workspace_id = get_current_user_workspace()
--   OR is_super_admin()
-- );

COMMIT;
