-- =============================================
-- 為 quote_items 添加資源關聯欄位
-- 用於關聯餐廳、飯店、景點等資料庫記錄
-- =============================================

BEGIN;

-- 添加資源類型欄位
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_type TEXT;

COMMENT ON COLUMN public.quote_items.resource_type IS '資源類型：restaurant（餐廳）/ hotel（飯店）/ attraction（景點）/ supplier（供應商）';

-- 添加資源 ID 欄位
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_id UUID;

COMMENT ON COLUMN public.quote_items.resource_id IS '關聯的資源 ID，指向對應類型的表格';

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_quote_items_resource_type ON public.quote_items(resource_type);
CREATE INDEX IF NOT EXISTS idx_quote_items_resource_id ON public.quote_items(resource_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_resource ON public.quote_items(resource_type, resource_id);

-- 添加 GPS 快取欄位（從關聯資源複製，便於直接使用）
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_latitude NUMERIC(10,7);

ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_longitude NUMERIC(10,7);

ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_address TEXT;

ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_phone TEXT;

ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS resource_google_maps_url TEXT;

COMMENT ON COLUMN public.quote_items.resource_latitude IS 'GPS 緯度（從關聯資源快取）';
COMMENT ON COLUMN public.quote_items.resource_longitude IS 'GPS 經度（從關聯資源快取）';
COMMENT ON COLUMN public.quote_items.resource_address IS '地址（從關聯資源快取）';
COMMENT ON COLUMN public.quote_items.resource_phone IS '電話（從關聯資源快取）';
COMMENT ON COLUMN public.quote_items.resource_google_maps_url IS 'Google Maps 連結（從關聯資源快取）';

COMMIT;
