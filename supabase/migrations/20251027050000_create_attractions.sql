-- 景點資料表
-- 目的：管理各地區的旅遊景點資訊

BEGIN;

-- ============================================
-- 1. 建立景點表
-- ============================================
CREATE TABLE IF NOT EXISTS public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本資訊
  name TEXT NOT NULL,                          -- 景點名稱
  name_en TEXT,                                -- 英文名稱
  description TEXT,                            -- 景點描述

  -- 地理位置（三層架構）
  country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES public.regions(id) ON DELETE SET NULL,  -- 可選
  city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,

  -- 分類資訊
  category TEXT,                               -- 類別：景點/餐廳/購物/交通/住宿
  tags TEXT[],                                 -- 標籤陣列：親子/文化/自然/美食

  -- 營業資訊
  opening_hours JSONB,                         -- 營業時間 {mon: "9:00-18:00", tue: "9:00-18:00"}
  duration_minutes INTEGER,                    -- 建議停留時間（分鐘）

  -- 聯絡資訊
  address TEXT,                                -- 地址
  phone TEXT,                                  -- 電話
  website TEXT,                                -- 官網

  -- 地圖資訊
  latitude DECIMAL(10, 8),                     -- 緯度
  longitude DECIMAL(11, 8),                    -- 經度
  google_maps_url TEXT,                        -- Google Maps 連結

  -- 圖片
  images TEXT[],                               -- 圖片 URLs 陣列
  thumbnail TEXT,                              -- 縮圖 URL

  -- 管理欄位
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  notes TEXT,                                  -- 內部備註

  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 建立索引用的欄位約束
  CONSTRAINT attractions_name_city_unique UNIQUE(name, city_id)
);

-- ============================================
-- 2. 建立索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attractions_country ON public.attractions(country_id);
CREATE INDEX IF NOT EXISTS idx_attractions_region ON public.attractions(region_id);
CREATE INDEX IF NOT EXISTS idx_attractions_city ON public.attractions(city_id);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON public.attractions(category);
CREATE INDEX IF NOT EXISTS idx_attractions_is_active ON public.attractions(is_active);
CREATE INDEX IF NOT EXISTS idx_attractions_tags ON public.attractions USING GIN(tags);

-- ============================================
-- 3. 建立 RLS 政策
-- ============================================
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

-- 所有人可讀（公開資訊）
CREATE POLICY "Allow public to read attractions"
  ON public.attractions FOR SELECT
  USING (true);

-- 認證用戶可寫
CREATE POLICY "Allow authenticated users to manage attractions"
  ON public.attractions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. 建立更新時間觸發器
-- ============================================

-- 創建或替換 updated_at 更新函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attractions_updated_at
  BEFORE UPDATE ON public.attractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. 插入範例資料
-- ============================================

-- 日本景點
INSERT INTO public.attractions (name, name_en, description, country_id, region_id, city_id, category, tags, duration_minutes, is_active, display_order) VALUES
  -- 福岡
  ('太宰府天滿宮', 'Dazaifu Tenmangu', '祭祀學問之神菅原道真的神社', 'japan', 'kyushu', 'fukuoka', '景點', ARRAY['文化', '神社'], 90, true, 1),
  ('福岡塔', 'Fukuoka Tower', '福岡市地標，可俯瞰博多灣美景', 'japan', 'kyushu', 'fukuoka', '景點', ARRAY['觀景', '地標'], 60, true, 2),
  ('一蘭拉麵', 'Ichiran Ramen', '福岡知名豚骨拉麵', 'japan', 'kyushu', 'fukuoka', '餐廳', ARRAY['美食', '拉麵'], 45, true, 3),

  -- 熊本
  ('熊本城', 'Kumamoto Castle', '日本三大名城之一', 'japan', 'kyushu', 'kumamoto', '景點', ARRAY['文化', '城堡', '歷史'], 120, true, 1),
  ('黑川溫泉', 'Kurokawa Onsen', '九州知名溫泉鄉', 'japan', 'kyushu', 'kumamoto', '住宿', ARRAY['溫泉', '放鬆'], 180, true, 2),

  -- 長崎
  ('稻佐山夜景', 'Mount Inasa', '日本三大夜景之一', 'japan', 'kyushu', 'nagasaki', '景點', ARRAY['觀景', '夜景'], 90, true, 1),
  ('軍艦島', 'Gunkanjima', '長崎廢墟島嶼', 'japan', 'kyushu', 'nagasaki', '景點', ARRAY['歷史', '世界遺產'], 180, true, 2),

  -- 東京
  ('淺草寺', 'Sensoji Temple', '東京最古老的寺廟', 'japan', 'kanto', 'tokyo', '景點', ARRAY['文化', '寺廟', '歷史'], 90, true, 1),
  ('晴空塔', 'Tokyo Skytree', '東京新地標，高634公尺', 'japan', 'kanto', 'tokyo', '景點', ARRAY['觀景', '地標'], 90, true, 2),
  ('築地市場', 'Tsukiji Market', '東京知名魚市場', 'japan', 'kanto', 'tokyo', '景點', ARRAY['美食', '市場'], 60, true, 3),

  -- 大阪
  ('大阪城', 'Osaka Castle', '大阪地標歷史名城', 'japan', 'kansai', 'osaka', '景點', ARRAY['文化', '城堡', '歷史'], 120, true, 1),
  ('道頓堀', 'Dotonbori', '大阪最熱鬧的美食街', 'japan', 'kansai', 'osaka', '景點', ARRAY['美食', '購物', '夜生活'], 90, true, 2),

  -- 京都
  ('清水寺', 'Kiyomizu-dera', '京都最著名寺廟', 'japan', 'kansai', 'kyoto', '景點', ARRAY['文化', '寺廟', '世界遺產'], 120, true, 1),
  ('伏見稻荷大社', 'Fushimi Inari', '千本鳥居著名神社', 'japan', 'kansai', 'kyoto', '景點', ARRAY['文化', '神社'], 90, true, 2);

-- 泰國景點
INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, tags, duration_minutes, is_active, display_order) VALUES
  -- 曼谷
  ('大皇宮', 'Grand Palace', '曼谷最重要的皇室建築', 'thailand', 'bangkok', '景點', ARRAY['文化', '宮殿', '歷史'], 120, true, 1),
  ('臥佛寺', 'Wat Pho', '供奉巨大臥佛的寺廟', 'thailand', 'bangkok', '景點', ARRAY['文化', '寺廟'], 60, true, 2),
  ('水上市場', 'Floating Market', '傳統泰式水上市場', 'thailand', 'bangkok', '景點', ARRAY['文化', '市場', '購物'], 120, true, 3),

  -- 清邁
  ('古城遺址', 'Historical Park', '清邁古城歷史遺跡', 'thailand', 'chiang-mai', '景點', ARRAY['文化', '歷史'], 180, true, 1),
  ('夜市', 'Night Market', '清邁週日夜市', 'thailand', 'chiang-mai', '景點', ARRAY['購物', '美食'], 120, true, 2),

  -- 普吉島
  ('芭東海灘', 'Patong Beach', '普吉島最熱鬧的海灘', 'thailand', 'phuket', '景點', ARRAY['海灘', '水上活動'], 180, true, 1),
  ('攀牙灣', 'Phang Nga Bay', '普吉知名跳島行程', 'thailand', 'phuket', '景點', ARRAY['海灘', '自然', '跳島'], 240, true, 2);

-- 韓國景點
INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, tags, duration_minutes, is_active, display_order) VALUES
  ('景福宮', 'Gyeongbokgung Palace', '首爾五大宮闕之首', 'korea', 'seoul', '景點', ARRAY['文化', '宮殿', '歷史'], 120, true, 1),
  ('明洞', 'Myeongdong', '首爾購物天堂', 'korea', 'seoul', '景點', ARRAY['購物', '美食'], 120, true, 2),
  ('南山塔', 'N Seoul Tower', '首爾地標觀景塔', 'korea', 'seoul', '景點', ARRAY['觀景', '地標'], 90, true, 3),

  ('海雲台海灘', 'Haeundae Beach', '釜山最著名海灘', 'korea', 'busan', '景點', ARRAY['海灘', '水上活動'], 180, true, 1),
  ('甘川文化村', 'Gamcheon Culture Village', '釜山彩色山城', 'korea', 'busan', '景點', ARRAY['文化', '拍照'], 90, true, 2),

  ('濱海道', 'Coastal Path', '濟州環島濱海步道', 'korea', 'jeju', '景點', ARRAY['自然', '健行'], 180, true, 1),
  ('城山日出峰', 'Seongsan Ilchulbong', '濟州火山地形景觀', 'korea', 'jeju', '景點', ARRAY['自然', '健行', '世界遺產'], 90, true, 2);

-- ============================================
-- 6. 註解
-- ============================================
COMMENT ON TABLE public.attractions IS '旅遊景點資料表';
COMMENT ON COLUMN public.attractions.name IS '景點名稱';
COMMENT ON COLUMN public.attractions.category IS '類別：景點/餐廳/購物/交通/住宿';
COMMENT ON COLUMN public.attractions.tags IS '標籤陣列';
COMMENT ON COLUMN public.attractions.duration_minutes IS '建議停留時間（分鐘）';
COMMENT ON COLUMN public.attractions.opening_hours IS '營業時間 JSON';

COMMIT;
