-- 整合 tour_destinations 到 ref_airports
-- 執行於 Supabase SQL Editor

-- Step 1: 新增欄位（如果不存在）
ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Step 2: 標記常用機場
UPDATE ref_airports SET is_favorite = true WHERE iata_code IN (
  'KMQ',
  'KIX',
  'HKG',
  'NRT',
  'FUK',
  'SFO',
  'DAD',
  'PUS',
  'HRB',
  'HND',
  'XMN'
);

-- Step 3: 驗證結果
SELECT iata_code, name_zh, city_name_zh, country_code, is_favorite 
FROM ref_airports 
WHERE is_favorite = true;
