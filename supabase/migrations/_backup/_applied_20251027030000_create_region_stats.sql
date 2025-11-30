-- 地區統計資料表
-- 目的：快取各城市的統計資訊，避免每次都跨表查詢

BEGIN;

-- ============================================
-- 1. 建立地區統計表
-- ============================================
CREATE TABLE IF NOT EXISTS public.region_stats (
  city_id TEXT PRIMARY KEY REFERENCES public.cities(id) ON DELETE CASCADE,

  -- 統計資訊
  attractions_count INTEGER DEFAULT 0,      -- 景點數量
  cost_templates_count INTEGER DEFAULT 0,   -- 成本模板數量
  quotes_count INTEGER DEFAULT 0,           -- 關聯報價單數量
  tours_count INTEGER DEFAULT 0,            -- 關聯旅遊團數量（未來）

  -- 更新時間
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 建立索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_region_stats_updated ON public.region_stats(updated_at);

-- ============================================
-- 3. 建立 RLS 政策
-- ============================================
ALTER TABLE public.region_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read region_stats"
  ON public.region_stats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage region_stats"
  ON public.region_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 4. 建立更新函數
-- ============================================

-- 更新特定城市的統計資訊
CREATE OR REPLACE FUNCTION public.update_city_stats(p_city_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.region_stats (city_id, attractions_count, cost_templates_count, quotes_count)
  VALUES (
    p_city_id,
    0,  -- 景點數量（attractions 表還沒建立，先設 0）
    0,  -- 成本模板數量（cost_templates 表還沒建立，先設 0）
    (SELECT COUNT(*) FROM public.quote_regions WHERE city = p_city_id)
  )
  ON CONFLICT (city_id)
  DO UPDATE SET
    quotes_count = (SELECT COUNT(*) FROM public.quote_regions WHERE city = p_city_id),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 更新所有城市的統計資訊
CREATE OR REPLACE FUNCTION public.refresh_all_region_stats()
RETURNS VOID AS $$
DECLARE
  city_record RECORD;
BEGIN
  FOR city_record IN SELECT id FROM public.cities LOOP
    PERFORM public.update_city_stats(city_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 建立觸發器（當報價單地區變動時自動更新）
-- ============================================

-- 當新增報價單地區關聯時
CREATE OR REPLACE FUNCTION public.trigger_update_stats_on_quote_region_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_city_stats(NEW.city);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_city_stats(OLD.city);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.update_city_stats(OLD.city);
    PERFORM public.update_city_stats(NEW.city);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_quote_region_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_regions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_stats_on_quote_region_change();

-- ============================================
-- 6. 初始化所有城市的統計資訊
-- ============================================
SELECT public.refresh_all_region_stats();

-- ============================================
-- 7. 註解
-- ============================================
COMMENT ON TABLE public.region_stats IS '地區統計資訊快取表';
COMMENT ON COLUMN public.region_stats.attractions_count IS '景點數量';
COMMENT ON COLUMN public.region_stats.cost_templates_count IS '成本模板數量';
COMMENT ON COLUMN public.region_stats.quotes_count IS '關聯報價單數量';

COMMIT;
