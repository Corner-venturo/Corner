-- 加上模板支援到 itineraries 表
-- 2026-03-09: 行程模板功能

-- 1. 加上模板相關欄位
ALTER TABLE itineraries
ADD COLUMN template_id VARCHAR(50),
ADD COLUMN template_code VARCHAR(50),
ADD COLUMN template_name VARCHAR(255);

-- 2. tour_id 改為可空（模板時不需要團號）
ALTER TABLE itineraries
ALTER COLUMN tour_id DROP NOT NULL;

-- 3. 加上 CHECK constraint（必須是實際團或模板，二選一）
ALTER TABLE itineraries
ADD CONSTRAINT itinerary_type_check 
CHECK (
  (tour_id IS NOT NULL AND template_id IS NULL) OR
  (tour_id IS NULL AND template_id IS NOT NULL)
);

-- 4. 加上索引（提升查詢效能）
CREATE INDEX idx_itineraries_template_id ON itineraries(template_id);

-- 5. 註解說明
COMMENT ON COLUMN itineraries.template_id IS '模板 ID（模板時有值，實際團時為 null）';
COMMENT ON COLUMN itineraries.template_code IS '模板代號（例如：TPL-JPN-001）';
COMMENT ON COLUMN itineraries.template_name IS '模板名稱（例如：日本東京經典 5 日遊）';
