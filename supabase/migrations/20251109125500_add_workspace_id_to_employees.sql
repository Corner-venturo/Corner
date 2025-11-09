-- ============================================
-- 為 Employees 加上 workspace_id
-- ============================================
-- 目的：讓員工資料有歸屬分公司（但仍可跨公司查看）
-- 注意：employees 保持 DISABLE RLS（全域共享）

BEGIN;

-- ============================================
-- Step 1: 新增 workspace_id 欄位
-- ============================================

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS workspace_id text;

COMMENT ON COLUMN public.employees.workspace_id IS '員工所屬分公司 ID（主要歸屬，但可跨公司查看）';

-- ============================================
-- Step 2: 建立外鍵關聯
-- ============================================

ALTER TABLE public.employees
ADD CONSTRAINT employees_workspace_id_fkey
FOREIGN KEY (workspace_id)
REFERENCES public.workspaces(id)
ON DELETE SET NULL;

-- ============================================
-- Step 3: 設定現有員工的預設 workspace
-- ============================================

-- 如果已有 workspaces 資料，將所有員工設定為第一個 workspace
DO $$
DECLARE
  default_workspace_id text;
BEGIN
  -- 取得第一個 workspace 的 ID
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  -- 如果有 workspace，更新所有沒有 workspace_id 的員工
  IF default_workspace_id IS NOT NULL THEN
    UPDATE public.employees
    SET workspace_id = default_workspace_id
    WHERE workspace_id IS NULL;

    RAISE NOTICE '已將所有員工設定為 workspace: %', default_workspace_id;
  ELSE
    RAISE NOTICE '尚未建立 workspace，跳過員工更新';
  END IF;
END $$;

-- ============================================
-- Step 4: 建立索引（提升查詢效能）
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_workspace_id
ON public.employees(workspace_id);

-- ============================================
-- 驗證結果
-- ============================================

DO $$
DECLARE
  total_employees INTEGER;
  employees_with_workspace INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_employees FROM public.employees;
  SELECT COUNT(*) INTO employees_with_workspace FROM public.employees WHERE workspace_id IS NOT NULL;

  RAISE NOTICE '✅ 總員工數：%', total_employees;
  RAISE NOTICE '✅ 已設定 workspace 的員工：%', employees_with_workspace;
END $$;

COMMIT;
