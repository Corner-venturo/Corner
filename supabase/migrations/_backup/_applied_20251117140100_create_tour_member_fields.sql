-- =====================================================
-- 團員動態欄位表
-- 建立日期：2025-11-17
-- 說明：儲存團員的動態欄位資料（分車、分房、分桌等）
-- =====================================================

BEGIN;

-- =====================================================
-- 1. 建立團員動態欄位表
-- =====================================================
DROP TABLE IF EXISTS public.tour_member_fields CASCADE;

CREATE TABLE public.tour_member_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  order_member_id UUID NOT NULL REFERENCES public.order_members(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_tour_member_field UNIQUE(tour_id, order_member_id, field_name)
);

COMMENT ON TABLE public.tour_member_fields IS '團員動態欄位資料（分車、分房、分桌等）';
COMMENT ON COLUMN public.tour_member_fields.tour_id IS '所屬旅遊團';
COMMENT ON COLUMN public.tour_member_fields.order_member_id IS '所屬團員';
COMMENT ON COLUMN public.tour_member_fields.field_name IS '欄位名稱（例如：分車、分房、分桌）';
COMMENT ON COLUMN public.tour_member_fields.field_value IS '欄位值（例如：A車、1號房）';
COMMENT ON COLUMN public.tour_member_fields.display_order IS '顯示順序（拖曳排序用）';

CREATE INDEX idx_tour_member_fields_tour ON public.tour_member_fields(tour_id);
CREATE INDEX idx_tour_member_fields_member ON public.tour_member_fields(order_member_id);
CREATE INDEX idx_tour_member_fields_name ON public.tour_member_fields(field_name);

-- =====================================================
-- 2. 建立更新時間觸發器
-- =====================================================
CREATE TRIGGER update_tour_member_fields_updated_at
  BEFORE UPDATE ON public.tour_member_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. 停用 RLS
-- =====================================================
ALTER TABLE public.tour_member_fields DISABLE ROW LEVEL SECURITY;

COMMIT;
