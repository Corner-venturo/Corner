-- =====================================================
-- 為旅遊團相關表格補上 workspace_id
-- 建立日期：2025-11-17
-- 目的：確保所有業務表格都有 workspace_id 欄位
-- =====================================================

BEGIN;

-- 1. tour_departure_data（出團資料主表）
-- 加上 workspace_id 欄位
ALTER TABLE public.tour_departure_data
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 從關聯的 tour 填入 workspace_id
UPDATE public.tour_departure_data tdd
SET workspace_id = t.workspace_id
FROM public.tours t
WHERE tdd.tour_id = t.id
AND tdd.workspace_id IS NULL;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tour_departure_data_workspace_id
ON public.tour_departure_data(workspace_id);

COMMENT ON COLUMN public.tour_departure_data.workspace_id IS 'Workspace ID inherited from tours';


-- 2. tour_member_fields（團員自訂欄位）
-- 加上 workspace_id 欄位
ALTER TABLE public.tour_member_fields
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 從關聯的 tour 填入 workspace_id
UPDATE public.tour_member_fields tmf
SET workspace_id = t.workspace_id
FROM public.tours t
WHERE tmf.tour_id = t.id
AND tmf.workspace_id IS NULL;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tour_member_fields_workspace_id
ON public.tour_member_fields(workspace_id);

COMMENT ON COLUMN public.tour_member_fields.workspace_id IS 'Workspace ID inherited from tours';


-- 3. 子表格（meals, accommodations, activities, others）不加 workspace_id
-- 原因：透過 JOIN tour_departure_data 即可過濾
-- 設計決策：保持子表格簡潔，減少冗餘欄位

COMMIT;

-- 驗證結果
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  -- 檢查 tour_departure_data 是否有 NULL workspace_id
  SELECT COUNT(*) INTO null_count
  FROM public.tour_departure_data
  WHERE workspace_id IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'tour_departure_data still has % rows with NULL workspace_id', null_count;
  ELSE
    RAISE NOTICE '✅ tour_departure_data: all rows have workspace_id';
  END IF;

  -- 檢查 tour_member_fields 是否有 NULL workspace_id
  SELECT COUNT(*) INTO null_count
  FROM public.tour_member_fields
  WHERE workspace_id IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'tour_member_fields still has % rows with NULL workspace_id', null_count;
  ELSE
    RAISE NOTICE '✅ tour_member_fields: all rows have workspace_id';
  END IF;
END $$;
