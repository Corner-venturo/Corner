-- 報價單多地區支援
-- 目的：支援跨縣市旅遊報價單，每個報價單可關聯多個城市

BEGIN;

-- 1. 建立報價單地區關聯表
CREATE TABLE IF NOT EXISTS public.quote_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id TEXT NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,

  -- 地區資訊（三層架構：國家 > 地區 > 城市）
  country TEXT NOT NULL,           -- 國家 ID (如: japan, thailand)
  country_name TEXT NOT NULL,      -- 國家名稱 (如: 日本, 泰國)
  region TEXT,                     -- 地區 ID (如: kyushu, kanto)，某些國家沒有地區層
  region_name TEXT,                -- 地區名稱 (如: 九州, 關東)
  city TEXT NOT NULL,              -- 城市 ID (如: fukuoka, tokyo)
  city_name TEXT NOT NULL,         -- 城市名稱 (如: 福岡, 東京)

  -- 順序與時間
  "order" INTEGER NOT NULL DEFAULT 0,  -- 旅遊順序（0, 1, 2...）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 確保同一個報價單不會有重複的城市
  UNIQUE(quote_id, city)
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_quote_regions_quote_id ON public.quote_regions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_regions_country ON public.quote_regions(country);
CREATE INDEX IF NOT EXISTS idx_quote_regions_city ON public.quote_regions(city);
CREATE INDEX IF NOT EXISTS idx_quote_regions_order ON public.quote_regions(quote_id, "order");

-- 3. 建立 RLS 政策
ALTER TABLE public.quote_regions ENABLE ROW LEVEL SECURITY;

-- 允許所有認證用戶讀取
CREATE POLICY "Allow authenticated users to read quote_regions"
  ON public.quote_regions
  FOR SELECT
  TO authenticated
  USING (true);

-- 允許所有認證用戶新增
CREATE POLICY "Allow authenticated users to insert quote_regions"
  ON public.quote_regions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允許所有認證用戶更新
CREATE POLICY "Allow authenticated users to update quote_regions"
  ON public.quote_regions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 允許所有認證用戶刪除
CREATE POLICY "Allow authenticated users to delete quote_regions"
  ON public.quote_regions
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. 更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION public.update_quote_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_regions_updated_at_trigger
  BEFORE UPDATE ON public.quote_regions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quote_regions_updated_at();

-- 5. 註解
COMMENT ON TABLE public.quote_regions IS '報價單地區關聯表，支援多地區（跨縣市）旅遊';
COMMENT ON COLUMN public.quote_regions.country IS '國家 ID';
COMMENT ON COLUMN public.quote_regions.region IS '地區 ID（某些國家可能沒有）';
COMMENT ON COLUMN public.quote_regions.city IS '城市 ID';
COMMENT ON COLUMN public.quote_regions."order" IS '旅遊順序，用於顯示 城市A → 城市B → 城市C';

COMMIT;
