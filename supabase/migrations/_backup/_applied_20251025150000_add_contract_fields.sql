-- 新增合約相關欄位到 tours 表格
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS contract_template TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS contract_content TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS contract_created_at TIMESTAMPTZ;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS contract_notes TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS contract_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS contract_archived_date TIMESTAMPTZ;

-- 新增信封寄件紀錄欄位
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS envelope_records TEXT;

-- 新增同步欄位
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS _needs_sync BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS _synced_at TIMESTAMPTZ;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tours_contract_template ON public.tours(contract_template);
CREATE INDEX IF NOT EXISTS idx_tours_needs_sync ON public.tours(_needs_sync) WHERE _needs_sync = TRUE;
CREATE INDEX IF NOT EXISTS idx_tours_deleted ON public.tours(_deleted) WHERE _deleted = TRUE;

-- 註解
COMMENT ON COLUMN public.tours.contract_template IS '合約範本: template_a, template_b, template_c, template_d';
COMMENT ON COLUMN public.tours.contract_content IS '合約內容（JSON 格式的填寫資料）';
COMMENT ON COLUMN public.tours.envelope_records IS '信封寄件紀錄（JSON 陣列）';
