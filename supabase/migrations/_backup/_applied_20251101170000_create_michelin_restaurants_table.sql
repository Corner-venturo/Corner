-- ============================================
-- 米其林餐廳資料表
-- 專業旅行社等級的餐飲資料庫
-- ============================================

BEGIN;

-- 建立米其林餐廳表
CREATE TABLE IF NOT EXISTS public.michelin_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本資訊
  name TEXT NOT NULL,
  name_en TEXT,
  name_local TEXT, -- 當地語言名稱（日文、法文等）

  -- 米其林評級
  michelin_stars INTEGER CHECK (michelin_stars >= 1 AND michelin_stars <= 3), -- 1-3 星
  michelin_guide_year INTEGER, -- 哪一年的米其林指南
  bib_gourmand BOOLEAN DEFAULT FALSE, -- 必比登推介
  michelin_plate BOOLEAN DEFAULT FALSE, -- 米其林餐盤
  green_star BOOLEAN DEFAULT FALSE, -- 綠星（永續餐廳）

  -- 地理位置
  country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES public.regions(id) ON DELETE SET NULL,
  city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  address TEXT,
  address_en TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_url TEXT,

  -- 餐廳類型
  cuisine_type TEXT[], -- 料理類型（法式、日式、中式、創意等）
  dining_style TEXT, -- 用餐風格（Fine Dining, Casual, Contemporary 等）
  price_range TEXT, -- 價格區間（$$, $$$, $$$$）
  avg_price_lunch INTEGER, -- 平均午餐價格
  avg_price_dinner INTEGER, -- 平均晚餐價格
  currency TEXT DEFAULT 'TWD', -- 幣別

  -- 聯絡資訊
  phone TEXT,
  email TEXT,
  website TEXT,
  reservation_url TEXT, -- 訂位連結
  reservation_required BOOLEAN DEFAULT TRUE,

  -- 營業時間（JSON 格式）
  opening_hours JSONB,
  -- 範例：
  -- {
  --   "monday": { "lunch": "12:00-14:30", "dinner": "18:00-22:00" },
  --   "tuesday": { "lunch": "12:00-14:30", "dinner": "18:00-22:00" },
  --   "closed": ["wednesday"]
  -- }

  -- 特色與描述
  description TEXT,
  description_en TEXT,
  chef_name TEXT, -- 主廚名字
  chef_profile TEXT, -- 主廚簡介
  signature_dishes TEXT[], -- 招牌菜
  specialties TEXT[], -- 特色（如：酒窖豐富、海景、花園等）

  -- 設施與服務
  facilities JSONB,
  -- 範例：
  -- {
  --   "parking": true,
  --   "wheelchair_accessible": true,
  --   "private_room": true,
  --   "outdoor_seating": true,
  --   "bar": true,
  --   "wine_cellar": true
  -- }

  -- 服裝規定
  dress_code TEXT, -- Smart Casual, Formal, etc.

  -- 用餐限制
  dining_restrictions JSONB,
  -- 範例：
  -- {
  --   "min_age": 12,
  --   "no_photography": true,
  --   "time_limit_minutes": 120
  -- }

  -- 圖片
  images TEXT[], -- 餐廳照片
  thumbnail TEXT, -- 縮圖
  menu_images TEXT[], -- 菜單照片

  -- 評價與獎項
  awards TEXT[], -- 其他獎項（如 World's 50 Best, Asia's 50 Best）
  ratings JSONB,
  -- 範例：
  -- {
  --   "google": 4.8,
  --   "tripadvisor": 5.0,
  --   "tabelog": 4.5
  -- }

  -- 旅行社專用
  commission_rate DECIMAL(5, 2), -- 佣金率
  booking_contact TEXT, -- 團體訂位聯絡人
  booking_email TEXT, -- 團體訂位信箱
  group_menu_available BOOLEAN DEFAULT FALSE, -- 是否提供團體菜單
  min_group_size INTEGER, -- 最小團體人數
  max_group_size INTEGER, -- 最大團體人數
  booking_notes TEXT, -- 訂位備註

  -- 推薦原因（給 OP 參考）
  recommended_for TEXT[], -- 適合場合（蜜月、商務、美食團、高端客戶等）
  best_season TEXT[], -- 最佳季節

  -- 系統欄位
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  notes TEXT, -- 內部備註
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 建立索引
CREATE INDEX idx_michelin_restaurants_country ON public.michelin_restaurants(country_id);
CREATE INDEX idx_michelin_restaurants_city ON public.michelin_restaurants(city_id);
CREATE INDEX idx_michelin_restaurants_stars ON public.michelin_restaurants(michelin_stars) WHERE michelin_stars IS NOT NULL;
CREATE INDEX idx_michelin_restaurants_bib ON public.michelin_restaurants(bib_gourmand) WHERE bib_gourmand = TRUE;
CREATE INDEX idx_michelin_restaurants_active ON public.michelin_restaurants(is_active);
CREATE INDEX idx_michelin_restaurants_cuisine ON public.michelin_restaurants USING GIN(cuisine_type);
CREATE INDEX idx_michelin_restaurants_name ON public.michelin_restaurants(name);

-- 更新時間自動觸發器
CREATE OR REPLACE FUNCTION update_michelin_restaurants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_michelin_restaurants_updated_at
  BEFORE UPDATE ON public.michelin_restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_michelin_restaurants_updated_at();

-- 禁用 RLS（內部管理系統）
ALTER TABLE public.michelin_restaurants DISABLE ROW LEVEL SECURITY;

-- 權限設定
GRANT ALL ON public.michelin_restaurants TO authenticated;
GRANT ALL ON public.michelin_restaurants TO service_role;

-- 註解
COMMENT ON TABLE public.michelin_restaurants IS '米其林餐廳資料表 - 專業旅行社等級';
COMMENT ON COLUMN public.michelin_restaurants.michelin_stars IS '米其林星級 (1-3)';
COMMENT ON COLUMN public.michelin_restaurants.bib_gourmand IS '必比登推介（高CP值）';
COMMENT ON COLUMN public.michelin_restaurants.green_star IS '綠星（永續餐廳）';
COMMENT ON COLUMN public.michelin_restaurants.commission_rate IS '旅行社佣金率 (%)';
COMMENT ON COLUMN public.michelin_restaurants.recommended_for IS '推薦場合（如：蜜月、美食團、VIP 客戶）';

COMMIT;
