-- 創建 itineraries 表格
BEGIN;

CREATE TABLE IF NOT EXISTS public.itineraries (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tour_id text REFERENCES public.tours(id) ON DELETE SET NULL,

  -- 封面資訊
  tagline text NOT NULL DEFAULT 'Corner Travel 2025',
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '精緻旅遊',
  description text,
  departure_date text NOT NULL,
  tour_code text NOT NULL,
  cover_image text,
  country text NOT NULL,
  city text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),

  -- 航班資訊 (JSON)
  outbound_flight jsonb,
  return_flight jsonb,

  -- 行程特色 (JSON Array)
  features jsonb DEFAULT '[]'::jsonb,

  -- 精選景點 (JSON Array)
  focus_cards jsonb DEFAULT '[]'::jsonb,

  -- 領隊資訊 (JSON)
  leader jsonb,

  -- 集合資訊 (JSON)
  meeting_info jsonb,

  -- 行程副標題
  itinerary_subtitle text,

  -- 逐日行程 (JSON Array)
  daily_itinerary jsonb DEFAULT '[]'::jsonb,

  -- 時間戳記
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 同步相關欄位
  _deleted boolean DEFAULT false,
  _needs_sync boolean DEFAULT false,
  _synced_at timestamptz
);

-- 創建索引
CREATE INDEX IF NOT EXISTS itineraries_tour_id_idx ON public.itineraries(tour_id);
CREATE INDEX IF NOT EXISTS itineraries_status_idx ON public.itineraries(status);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON public.itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS itineraries_country_city_idx ON public.itineraries(country, city);

-- 添加註釋
COMMENT ON TABLE public.itineraries IS '行程表資料';
COMMENT ON COLUMN public.itineraries.tour_id IS '關聯的旅遊團 ID（選填）';
COMMENT ON COLUMN public.itineraries.status IS '行程狀態：draft=草稿, published=已發布';
COMMENT ON COLUMN public.itineraries.outbound_flight IS '去程航班資訊（JSON格式）';
COMMENT ON COLUMN public.itineraries.return_flight IS '回程航班資訊（JSON格式）';
COMMENT ON COLUMN public.itineraries.features IS '行程特色列表（JSON陣列）';
COMMENT ON COLUMN public.itineraries.daily_itinerary IS '逐日行程（JSON陣列）';

-- 啟用 RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- RLS 政策：所有已認證用戶可以讀取
CREATE POLICY "Enable read access for authenticated users" ON public.itineraries
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS 政策：所有已認證用戶可以新增
CREATE POLICY "Enable insert access for authenticated users" ON public.itineraries
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS 政策：所有已認證用戶可以更新
CREATE POLICY "Enable update access for authenticated users" ON public.itineraries
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS 政策：所有已認證用戶可以刪除
CREATE POLICY "Enable delete access for authenticated users" ON public.itineraries
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION public.update_itineraries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_itineraries_updated_at();

COMMIT;
