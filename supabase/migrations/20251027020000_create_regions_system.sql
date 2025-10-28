-- 完整的地區管理系統
-- 目的：建立三層地區架構（國家 > 地區 > 城市），支援景點和成本模板管理

BEGIN;

-- ============================================
-- 0. 刪除舊的 regions 表（如果存在）
-- ============================================
DROP TABLE IF EXISTS public.regions CASCADE;

-- ============================================
-- 1. 國家表 (Countries)
-- ============================================
CREATE TABLE IF NOT EXISTS public.countries (
  id TEXT PRIMARY KEY,                    -- 國家 ID (如: japan, thailand)
  name TEXT NOT NULL,                     -- 中文名稱 (如: 日本, 泰國)
  name_en TEXT NOT NULL,                  -- 英文名稱 (如: Japan, Thailand)
  emoji TEXT,                             -- 國旗 emoji (如: 🇯🇵, 🇹🇭)
  code TEXT UNIQUE,                       -- ISO 國家代碼 (如: JP, TH)
  has_regions BOOLEAN DEFAULT false,      -- 是否有地區分類
  display_order INTEGER DEFAULT 0,        -- 顯示順序
  is_active BOOLEAN DEFAULT true,         -- 是否啟用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 地區表 (Regions) - 可選層級
-- ============================================
CREATE TABLE IF NOT EXISTS public.regions (
  id TEXT PRIMARY KEY,                    -- 地區 ID (如: kyushu, kanto)
  country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- 中文名稱 (如: 九州, 關東)
  name_en TEXT,                           -- 英文名稱 (如: Kyushu, Kanto)
  description TEXT,                       -- 地區描述
  display_order INTEGER DEFAULT 0,        -- 顯示順序
  is_active BOOLEAN DEFAULT true,         -- 是否啟用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(country_id, name)
);

-- ============================================
-- 3. 城市表 (Cities)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cities (
  id TEXT PRIMARY KEY,                    -- 城市 ID (如: fukuoka, tokyo)
  country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES public.regions(id) ON DELETE SET NULL,  -- 可選
  name TEXT NOT NULL,                     -- 中文名稱 (如: 福岡, 東京)
  name_en TEXT,                           -- 英文名稱 (如: Fukuoka, Tokyo)
  description TEXT,                       -- 城市描述
  timezone TEXT,                          -- 時區 (如: Asia/Tokyo)
  display_order INTEGER DEFAULT 0,        -- 顯示順序
  is_active BOOLEAN DEFAULT true,         -- 是否啟用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(country_id, name)
);

-- ============================================
-- 4. 建立索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_countries_active ON public.countries(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_regions_country ON public.regions(country_id);
CREATE INDEX IF NOT EXISTS idx_regions_active ON public.regions(country_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_region ON public.cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_active ON public.cities(country_id, is_active, display_order);

-- ============================================
-- 5. 建立 RLS 政策
-- ============================================
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- 所有認證用戶可讀取
CREATE POLICY "Allow authenticated users to read countries"
  ON public.countries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read regions"
  ON public.regions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read cities"
  ON public.cities FOR SELECT TO authenticated USING (true);

-- 所有認證用戶可新增/更新/刪除（未來可改為僅管理員）
CREATE POLICY "Allow authenticated users to manage countries"
  ON public.countries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage regions"
  ON public.regions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage cities"
  ON public.cities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 6. 更新 updated_at 觸發器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_countries_updated_at_trigger
  BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.update_regions_updated_at();

CREATE TRIGGER update_regions_updated_at_trigger
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.update_regions_updated_at();

CREATE TRIGGER update_cities_updated_at_trigger
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.update_regions_updated_at();

-- ============================================
-- 7. 註解
-- ============================================
COMMENT ON TABLE public.countries IS '國家資料表';
COMMENT ON TABLE public.regions IS '地區資料表（某些國家可選）';
COMMENT ON TABLE public.cities IS '城市資料表';

COMMENT ON COLUMN public.countries.has_regions IS '是否有地區分類（如日本有關東/關西，泰國沒有）';
COMMENT ON COLUMN public.cities.region_id IS '所屬地區（可為空，如泰國的城市沒有地區）';

-- ============================================
-- 8. 插入初始資料（範例）
-- ============================================

-- 日本
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('japan', '日本', 'Japan', '🇯🇵', 'JP', true, 1);

INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('hokkaido', 'japan', '北海道', 'Hokkaido', 1),
  ('kanto', 'japan', '關東', 'Kanto', 2),
  ('kansai', 'japan', '關西', 'Kansai', 3),
  ('kyushu', 'japan', '九州', 'Kyushu', 4),
  ('okinawa', 'japan', '沖繩', 'Okinawa', 5);

INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 北海道
  ('sapporo', 'japan', 'hokkaido', '札幌', 'Sapporo', 1),
  -- 關東
  ('tokyo', 'japan', 'kanto', '東京', 'Tokyo', 1),
  ('yokohama', 'japan', 'kanto', '橫濱', 'Yokohama', 2),
  -- 關西
  ('osaka', 'japan', 'kansai', '大阪', 'Osaka', 1),
  ('kyoto', 'japan', 'kansai', '京都', 'Kyoto', 2),
  ('kobe', 'japan', 'kansai', '神戶', 'Kobe', 3),
  -- 九州
  ('fukuoka', 'japan', 'kyushu', '福岡', 'Fukuoka', 1),
  ('kumamoto', 'japan', 'kyushu', '熊本', 'Kumamoto', 2),
  ('nagasaki', 'japan', 'kyushu', '長崎', 'Nagasaki', 3),
  -- 沖繩
  ('naha', 'japan', 'okinawa', '那霸', 'Naha', 1);

-- 泰國（沒有地區分類）
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('thailand', '泰國', 'Thailand', '🇹🇭', 'TH', false, 2);

INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('bangkok', 'thailand', NULL, '曼谷', 'Bangkok', 1),
  ('chiang-mai', 'thailand', NULL, '清邁', 'Chiang Mai', 2),
  ('phuket', 'thailand', NULL, '普吉島', 'Phuket', 3);

-- 韓國
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('korea', '韓國', 'South Korea', '🇰🇷', 'KR', false, 3);

INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('seoul', 'korea', NULL, '首爾', 'Seoul', 1),
  ('busan', 'korea', NULL, '釜山', 'Busan', 2),
  ('jeju', 'korea', NULL, '濟州島', 'Jeju', 3);

COMMIT;
