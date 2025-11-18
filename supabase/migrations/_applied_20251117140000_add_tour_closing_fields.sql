-- =====================================================
-- 新增團體結團欄位
-- 建立日期：2025-01-17
-- 說明：支援團體結團功能，用於會計模組自動拋轉
-- =====================================================

BEGIN;

-- 新增結團狀態欄位
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS closing_status VARCHAR(20) DEFAULT 'open'
  CHECK (closing_status IN ('open', 'closing', 'closed')),
ADD COLUMN IF NOT EXISTS closing_date DATE,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES public.employees(id);

COMMENT ON COLUMN public.tours.closing_status IS '結團狀態：open(進行中), closing(結團中), closed(已結團)';
COMMENT ON COLUMN public.tours.closing_date IS '結團日期';
COMMENT ON COLUMN public.tours.closed_by IS '結團操作人員';

-- 建立索引（方便查詢已結團的團體）
CREATE INDEX IF NOT EXISTS idx_tours_closing_status ON public.tours(closing_status);
CREATE INDEX IF NOT EXISTS idx_tours_closing_date ON public.tours(closing_date);

COMMIT;
