-- 為缺少 workspace_id 的表格新增欄位
-- 包含：attractions, visas, receipt_orders

BEGIN;

-- ============================================
-- 1. attractions (景點)
-- ============================================

-- 新增 workspace_id 欄位
ALTER TABLE public.attractions
ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- 為現有資料填入 workspace_id（從第一個 workspace）
UPDATE public.attractions
SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1)
WHERE workspace_id IS NULL;

-- 設為 NOT NULL
ALTER TABLE public.attractions
ALTER COLUMN workspace_id SET NOT NULL;

-- 新增外鍵約束
ALTER TABLE public.attractions
ADD CONSTRAINT fk_attractions_workspace
FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
ON DELETE CASCADE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_attractions_workspace_id ON public.attractions(workspace_id);

-- 更新註解
COMMENT ON COLUMN public.attractions.workspace_id IS '所屬工作空間 ID（多租戶隔離）';

-- ============================================
-- 2. visas (簽證)
-- ============================================

-- 新增 workspace_id 欄位
ALTER TABLE public.visas
ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- 為現有資料填入 workspace_id（從 order_id 關聯的 orders 表取得）
UPDATE public.visas v
SET workspace_id = o.workspace_id
FROM public.orders o
WHERE v.order_id = o.id
  AND v.workspace_id IS NULL;

-- 如果還有 NULL 的（沒有關聯 order），設定為第一個 workspace
UPDATE public.visas
SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1)
WHERE workspace_id IS NULL;

-- 設為 NOT NULL
ALTER TABLE public.visas
ALTER COLUMN workspace_id SET NOT NULL;

-- 新增外鍵約束
ALTER TABLE public.visas
ADD CONSTRAINT fk_visas_workspace
FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
ON DELETE CASCADE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_visas_workspace_id ON public.visas(workspace_id);

-- 更新註解
COMMENT ON COLUMN public.visas.workspace_id IS '所屬工作空間 ID（多租戶隔離）';

-- ============================================
-- 3. receipt_orders (收款單)
-- ============================================

-- 新增 workspace_id 欄位
ALTER TABLE public.receipt_orders
ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- 為現有資料填入 workspace_id（從 order_id 關聯的 orders 表取得）
UPDATE public.receipt_orders ro
SET workspace_id = o.workspace_id
FROM public.orders o
WHERE ro.order_id = o.id
  AND ro.workspace_id IS NULL;

-- 如果還有 NULL 的（沒有關聯 order），設定為第一個 workspace
UPDATE public.receipt_orders
SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1)
WHERE workspace_id IS NULL;

-- 設為 NOT NULL
ALTER TABLE public.receipt_orders
ALTER COLUMN workspace_id SET NOT NULL;

-- 新增外鍵約束
ALTER TABLE public.receipt_orders
ADD CONSTRAINT fk_receipt_orders_workspace
FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
ON DELETE CASCADE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_receipt_orders_workspace_id ON public.receipt_orders(workspace_id);

-- 更新註解
COMMENT ON COLUMN public.receipt_orders.workspace_id IS '所屬工作空間 ID（多租戶隔離）';

-- ============================================
-- 完成
-- ============================================

COMMIT;
