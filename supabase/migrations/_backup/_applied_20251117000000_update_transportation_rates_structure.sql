-- 更新車資管理表格結構
-- 新增欄位以支援品項分類、廠商、路線等資訊

BEGIN;

-- 新增欄位
ALTER TABLE public.transportation_rates
ADD COLUMN IF NOT EXISTS category text,                    -- 大分類/品項（如：4座車、7座車、16座車）
ADD COLUMN IF NOT EXISTS supplier text,                    -- 廠商名稱（如：XX旅行社）
ADD COLUMN IF NOT EXISTS route text,                       -- 行程路線（如：市區飯店－會安）
ADD COLUMN IF NOT EXISTS trip_type text,                   -- 行程類型（如：單程、往返）
ADD COLUMN IF NOT EXISTS cost_vnd numeric(12,2),           -- 成本價（越南盾）
ADD COLUMN IF NOT EXISTS price_twd numeric(12,2),          -- 售價（台幣）
ADD COLUMN IF NOT EXISTS kkday_selling_price numeric(12,2), -- KKDAY售價
ADD COLUMN IF NOT EXISTS kkday_cost numeric(12,2),         -- KKDAY成本
ADD COLUMN IF NOT EXISTS kkday_profit numeric(12,2),       -- KKDAY利潤
ADD COLUMN IF NOT EXISTS is_backup boolean DEFAULT false;  -- 是否為備用廠商

-- 新增欄位說明
COMMENT ON COLUMN public.transportation_rates.category IS '品項大分類（如：4座車、7座車）';
COMMENT ON COLUMN public.transportation_rates.supplier IS '廠商名稱（可選）';
COMMENT ON COLUMN public.transportation_rates.route IS '行程路線（如：市區飯店－會安）';
COMMENT ON COLUMN public.transportation_rates.trip_type IS '行程類型（如：單程、往返）';
COMMENT ON COLUMN public.transportation_rates.cost_vnd IS '成本價（越南盾）';
COMMENT ON COLUMN public.transportation_rates.price_twd IS '售價（台幣）';
COMMENT ON COLUMN public.transportation_rates.kkday_selling_price IS 'KKDAY平台售價';
COMMENT ON COLUMN public.transportation_rates.kkday_cost IS 'KKDAY平台成本';
COMMENT ON COLUMN public.transportation_rates.kkday_profit IS 'KKDAY平台利潤';
COMMENT ON COLUMN public.transportation_rates.is_backup IS '是否為備用廠商';

-- 更新現有資料（將 vehicle_type 資料遷移到 category）
UPDATE public.transportation_rates
SET category = vehicle_type
WHERE category IS NULL;

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_transportation_rates_category
ON public.transportation_rates(category);

CREATE INDEX IF NOT EXISTS idx_transportation_rates_supplier
ON public.transportation_rates(supplier);

CREATE INDEX IF NOT EXISTS idx_transportation_rates_route
ON public.transportation_rates(route);

COMMIT;
