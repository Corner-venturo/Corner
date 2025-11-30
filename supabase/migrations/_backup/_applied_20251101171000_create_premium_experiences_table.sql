-- ============================================
-- 頂級在地體驗資料表
-- 專業旅行社等級 - 獨特、深度、高端體驗
-- ============================================

BEGIN;

-- 建立頂級體驗表
CREATE TABLE IF NOT EXISTS public.premium_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本資訊
  name TEXT NOT NULL,
  name_en TEXT,
  name_local TEXT,
  tagline TEXT, -- 宣傳標語

  -- 地理位置
  country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES public.regions(id) ON DELETE SET NULL,
  city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  specific_location TEXT, -- 具體地點（如：京都祇園花街、巴黎瑪黑區藝廊）
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- 體驗分類
  category TEXT NOT NULL,
  -- 分類：
  -- - cultural_immersion: 文化沉浸（茶道、書法、傳統工藝）
  -- - exclusive_access: 獨家造訪（私人博物館、閉館參觀、VIP 後台）
  -- - culinary_mastery: 料理大師（私廚體驗、市場導覽+烹飪、酒莊品酒）
  -- - artisan_workshop: 工匠工作坊（陶藝、染織、刀匠、釀酒）
  -- - nature_adventure: 自然探險（私人嚮導登山、賞鯨、極光、潛水）
  -- - spiritual_wellness: 靈性養生（寺廟修行、溫泉療癒、冥想）
  -- - luxury_lifestyle: 奢華體驗（私人遊艇、直升機、超跑、高爾夫）
  -- - local_insider: 在地內行（傳統市場、街頭美食、夜生活）

  sub_category TEXT[], -- 子分類

  -- 獨特性等級
  exclusivity_level TEXT NOT NULL,
  -- - ultra_exclusive: 極致獨家（全球<10個名額/年）
  -- - highly_exclusive: 高度獨家（需提前6個月預約）
  -- - exclusive: 獨家（限定名額）
  -- - premium: 精品（高品質但較易預約）

  -- 體驗描述
  description TEXT NOT NULL,
  description_en TEXT,
  highlights TEXT[], -- 精華重點（bullet points）
  what_makes_it_special TEXT, -- 為何特別（獨特賣點）

  -- 達人/專家資訊
  expert_name TEXT, -- 達人姓名
  expert_title TEXT, -- 達人頭銜
  expert_credentials TEXT[], -- 資歷（如：三代傳承、米其林主廚、國寶級工匠）
  expert_profile TEXT, -- 達人簡介

  -- 體驗詳情
  duration_hours DECIMAL(4,1), -- 時長（小時）
  group_size_min INTEGER,
  group_size_max INTEGER,
  language_support TEXT[], -- 支援語言
  difficulty_level TEXT, -- 難度（easy, moderate, challenging）
  physical_requirement TEXT, -- 體能要求

  -- 時間安排
  available_seasons TEXT[], -- 可用季節
  best_time_of_day TEXT, -- 最佳時段
  advance_booking_days INTEGER, -- 需提前預約天數

  -- 價格資訊（專業旅行社等級）
  price_per_person_min INTEGER,
  price_per_person_max INTEGER,
  currency TEXT DEFAULT 'TWD',
  price_includes TEXT[], -- 包含項目
  price_excludes TEXT[], -- 不包含項目

  -- 旅行社專用
  commission_rate DECIMAL(5, 2),
  net_price_per_person INTEGER, -- 淨價
  booking_contact TEXT,
  booking_email TEXT,
  booking_phone TEXT,
  cancellation_policy TEXT,
  minimum_participants INTEGER, -- 最少成團人數

  -- 特殊要求
  dress_code TEXT,
  what_to_bring TEXT[],
  restrictions TEXT[], -- 限制（如：年齡、懷孕、疾病）

  -- 交通資訊
  meeting_point TEXT,
  meeting_point_coords JSONB, -- {"lat": 35.0116, "lng": 135.7681}
  transportation_included BOOLEAN DEFAULT FALSE,
  pickup_service BOOLEAN DEFAULT FALSE,

  -- 包含內容
  inclusions JSONB,
  -- 範例：
  -- {
  --   "meals": ["traditional_tea_ceremony_sweets"],
  --   "materials": ["all_materials_and_tools"],
  --   "souvenirs": ["handmade_souvenir_to_take_home"],
  --   "photos": ["professional_photography_included"]
  -- }

  -- 媒體
  images TEXT[],
  thumbnail TEXT,
  video_url TEXT,

  -- 認證與獎項
  certifications TEXT[], -- 認證（如：UNESCO、國家認證工藝師）
  awards TEXT[], -- 獎項
  media_features TEXT[], -- 媒體報導（CNN、BBC、孤獨星球等）

  -- 推薦資訊
  recommended_for TEXT[],
  -- 範例：["honeymoon", "culture_enthusiast", "food_lover", "luxury_traveler", "senior_friendly"]
  best_for_age_group TEXT,
  suitable_for_children BOOLEAN DEFAULT FALSE,

  -- 相關資訊
  related_attractions TEXT[], -- 附近景點
  combine_with TEXT[], -- 可搭配的體驗（UUID）

  -- 永續性
  sustainability_practices TEXT[],
  supports_local_community BOOLEAN DEFAULT FALSE,
  eco_friendly BOOLEAN DEFAULT FALSE,

  -- 評價
  ratings JSONB,
  -- 範例：
  -- {
  --   "overall": 4.9,
  --   "authenticity": 5.0,
  --   "value": 4.8,
  --   "expert_quality": 5.0
  -- }
  review_count INTEGER DEFAULT 0,

  -- 系統欄位
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- 精選推薦
  display_order INTEGER DEFAULT 0,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 建立索引
CREATE INDEX idx_premium_experiences_country ON public.premium_experiences(country_id);
CREATE INDEX idx_premium_experiences_city ON public.premium_experiences(city_id);
CREATE INDEX idx_premium_experiences_category ON public.premium_experiences(category);
CREATE INDEX idx_premium_experiences_exclusivity ON public.premium_experiences(exclusivity_level);
CREATE INDEX idx_premium_experiences_active ON public.premium_experiences(is_active);
CREATE INDEX idx_premium_experiences_featured ON public.premium_experiences(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_premium_experiences_sub_category ON public.premium_experiences USING GIN(sub_category);
CREATE INDEX idx_premium_experiences_recommended_for ON public.premium_experiences USING GIN(recommended_for);

-- 更新時間自動觸發器
CREATE OR REPLACE FUNCTION update_premium_experiences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_premium_experiences_updated_at
  BEFORE UPDATE ON public.premium_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_experiences_updated_at();

-- 禁用 RLS
ALTER TABLE public.premium_experiences DISABLE ROW LEVEL SECURITY;

-- 權限設定
GRANT ALL ON public.premium_experiences TO authenticated;
GRANT ALL ON public.premium_experiences TO service_role;

-- 註解
COMMENT ON TABLE public.premium_experiences IS '頂級在地體驗 - 獨特、深度、專業旅行社等級';
COMMENT ON COLUMN public.premium_experiences.exclusivity_level IS '獨特性等級（ultra_exclusive 至 premium）';
COMMENT ON COLUMN public.premium_experiences.expert_credentials IS '達人資歷（如：三代傳承、國寶級）';
COMMENT ON COLUMN public.premium_experiences.what_makes_it_special IS '為何特別 - 獨特賣點';

COMMIT;
