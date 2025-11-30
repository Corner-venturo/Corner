-- ============================================
-- 擴展 cost_templates 表以支援交通服務詳細資訊
-- Purpose: 支援 Excel 租車+導遊費用資料
-- Date: 2025-11-12
-- ============================================

BEGIN;

-- 新增欄位
ALTER TABLE public.cost_templates
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,        -- 車型：4人車、7人車、16人車、VIP車
ADD COLUMN IF NOT EXISTS trip_type TEXT,           -- 行程類型：單程、往返
ADD COLUMN IF NOT EXISTS route_origin TEXT,        -- 起點：市區飯店、峴港機場
ADD COLUMN IF NOT EXISTS route_destination TEXT,   -- 終點：會安、巴拿山
ADD COLUMN IF NOT EXISTS base_distance_km INTEGER, -- 基本公里數
ADD COLUMN IF NOT EXISTS base_hours INTEGER,       -- 基本時數
ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(10,2),    -- 超時費率（每小時）
ADD COLUMN IF NOT EXISTS extra_km_rate DECIMAL(10,2);    -- 超公里費率（每公里）

-- 新增註解
COMMENT ON COLUMN public.cost_templates.vehicle_type IS '車型（4人車、7人車、16人車、VIP車）';
COMMENT ON COLUMN public.cost_templates.trip_type IS '行程類型（單程、往返）';
COMMENT ON COLUMN public.cost_templates.route_origin IS '起點（市區飯店、峴港機場等）';
COMMENT ON COLUMN public.cost_templates.route_destination IS '終點（會安、巴拿山等）';
COMMENT ON COLUMN public.cost_templates.base_distance_km IS '基本公里數';
COMMENT ON COLUMN public.cost_templates.base_hours IS '基本時數';
COMMENT ON COLUMN public.cost_templates.overtime_rate IS '超時費率（每小時）';
COMMENT ON COLUMN public.cost_templates.extra_km_rate IS '超公里費率（每公里）';

-- 新增索引（提升查詢效能）
CREATE INDEX IF NOT EXISTS idx_cost_templates_vehicle_type ON public.cost_templates(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_cost_templates_trip_type ON public.cost_templates(trip_type);

COMMIT;
