-- Phase 1: MVP --

-- 3.1 深度精選內容
-- 新增 articles 資料表
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  content_html TEXT NOT NULL,
  cover_image VARCHAR(500),
  author_id UUID REFERENCES users(id),
  tags TEXT[], -- PostgreSQL array
  status VARCHAR(20) DEFAULT 'draft', -- draft, published
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3.2 景點紙娃娃系統
-- 新增 user_itineraries 資料表
CREATE TABLE user_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  destination VARCHAR(100),
  start_date DATE,
  end_date DATE,
  items JSONB, -- 儲存完整行程結構
  status VARCHAR(20) DEFAULT 'draft', -- draft, inquiry_sent
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 為 user_itineraries 啟用 RLS
ALTER TABLE user_itineraries ENABLE ROW LEVEL SECURITY;

-- 新增 RLS 政策，讓使用者只能管理自己的行程
CREATE POLICY "Users can manage own itineraries" ON user_itineraries
FOR ALL USING (auth.uid() = user_id);

-- 3.3 會員系統
-- 擴展 customers 表，關聯 auth
ALTER TABLE customers ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN membership_level VARCHAR(20) DEFAULT 'basic';

-- 新增 user_favorites 資料表
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  item_type VARCHAR(50), -- article, attraction, itinerary
  item_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- 3.4 我的訂單
-- orders 表新增 QR Code 相關欄位
ALTER TABLE orders ADD COLUMN qr_token UUID DEFAULT gen_random_uuid();
ALTER TABLE orders ADD COLUMN checked_in_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN checked_in_by UUID; -- 導遊 ID

-- 為 orders 啟用 RLS
-- 注意：這假設 orders 表已經存在。如果不存在，你需要先建立它。
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY; -- 根據需要取消註解

-- 新增 RLS 政策，讓客戶只能看自己的訂單
-- 這條政策假設 customers 表中的 auth_user_id 已經被正確填充
CREATE POLICY "Customers can view their own orders" ON orders
FOR SELECT USING (
  customer_id IN (
    SELECT id FROM customers 
    WHERE auth_user_id = auth.uid()
  )
);


-- Phase 2: 驗證後開發 (先註解掉) --

/*
-- 3.5 導遊 Uber
-- 新增 guide_profiles 資料表
CREATE TABLE guide_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  languages TEXT[],
  specialties TEXT[], -- 美食、歷史、攝影...
  hourly_rate DECIMAL(10,2),
  rating DECIMAL(3,2),
  total_tours INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT false,
  current_location POINT, -- PostGIS
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 新增 guide_requests 資料表
CREATE TABLE guide_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id UUID REFERENCES auth.users(id),
  location POINT,
  location_name VARCHAR(255),
  requested_time TIMESTAMP,
  duration_hours INTEGER,
  languages TEXT[],
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, matched, completed, cancelled
  matched_guide_id UUID REFERENCES guide_profiles(id),
  matched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3.6 旅客揪團
-- 新增 social_activities 資料表
CREATE TABLE social_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id),
  activity_type VARCHAR(50), -- carpool, dining, shopping, event
  title VARCHAR(255),
  description TEXT,
  location POINT,
  location_name VARCHAR(255),
  activity_time TIMESTAMP,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'open', -- open, full, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- 新增 activity_participants 資料表
CREATE TABLE activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES social_activities(id),
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);
*/
