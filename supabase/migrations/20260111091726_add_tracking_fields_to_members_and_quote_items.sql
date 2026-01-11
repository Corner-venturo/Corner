-- =============================================
-- Migration: 補齊 members 和 quote_items 表格的追蹤欄位
-- 目的：確保每個操作都能追蹤是誰、哪個公司做的
-- =============================================

BEGIN;

-- =============================================
-- 1. members 表格：添加 workspace_id 和 created_by
-- =============================================

-- 添加 workspace_id 欄位
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 添加 created_by 欄位
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.employees(id);

-- 從關聯的 orders 表格填充現有資料的 workspace_id
UPDATE public.members m
SET workspace_id = o.workspace_id
FROM public.orders o
WHERE m.order_id = o.id
AND m.workspace_id IS NULL;

-- 添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_members_workspace_id ON public.members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_created_by ON public.members(created_by);

COMMENT ON COLUMN public.members.workspace_id IS '所屬公司/工作區';
COMMENT ON COLUMN public.members.created_by IS '建立者員工 ID';

-- =============================================
-- 2. quote_items 表格：添加 workspace_id
-- =============================================

-- 添加 workspace_id 欄位
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 從關聯的 quotes 表格填充現有資料的 workspace_id
UPDATE public.quote_items qi
SET workspace_id = q.workspace_id
FROM public.quotes q
WHERE qi.quote_id = q.id
AND qi.workspace_id IS NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_quote_items_workspace_id ON public.quote_items(workspace_id);

COMMENT ON COLUMN public.quote_items.workspace_id IS '所屬公司/工作區';

-- =============================================
-- 3. 更新 RLS 政策（如果需要）
-- =============================================

-- members 表格 RLS
DO $$
BEGIN
  -- 檢查是否已啟用 RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'members'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 刪除舊的 policy（如果存在）
DROP POLICY IF EXISTS "members_workspace_isolation" ON public.members;

-- 創建新的 workspace 隔離 policy
CREATE POLICY "members_workspace_isolation" ON public.members
FOR ALL
USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
  OR workspace_id IS NULL  -- 允許舊資料（尚未填充 workspace_id）
);

-- quote_items 表格 RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'quote_items'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "quote_items_workspace_isolation" ON public.quote_items;

CREATE POLICY "quote_items_workspace_isolation" ON public.quote_items
FOR ALL
USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
  OR workspace_id IS NULL
);

COMMIT;
