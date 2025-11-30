-- 為 regions 表格新增 workspace_id
-- regions 是三層地區架構的中間層（Countries > Regions > Cities）

BEGIN;

-- 新增 workspace_id 欄位
ALTER TABLE public.regions
ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- 為現有資料填入 workspace_id（從第一個 workspace）
UPDATE public.regions
SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1)
WHERE workspace_id IS NULL;

-- 設為 NOT NULL
ALTER TABLE public.regions
ALTER COLUMN workspace_id SET NOT NULL;

-- 新增外鍵約束
ALTER TABLE public.regions
ADD CONSTRAINT fk_regions_workspace
FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
ON DELETE CASCADE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_regions_workspace_id ON public.regions(workspace_id);

-- 更新註解
COMMENT ON COLUMN public.regions.workspace_id IS '所屬工作空間 ID（多租戶隔離）';

COMMIT;
