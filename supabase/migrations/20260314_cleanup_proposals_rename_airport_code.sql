-- ============================================
-- Migration: 清理提案系統 + main_city_id → airport_code
-- Date: 2026-03-14
-- ============================================

-- 1. 刪除 proposals 和 proposal_packages 表
DROP TABLE IF EXISTS proposal_packages CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;

-- 2. tours 表清理 proposal 關聯欄位
ALTER TABLE tours DROP COLUMN IF EXISTS proposal_id;
ALTER TABLE tours DROP COLUMN IF EXISTS proposal_package_id;
ALTER TABLE tours DROP COLUMN IF EXISTS converted_from_proposal;

-- 3. main_city_id → airport_code（tours）
ALTER TABLE tours DROP CONSTRAINT IF EXISTS tours_main_city_id_fkey;
ALTER TABLE tours RENAME COLUMN main_city_id TO airport_code;

-- 4. main_city_id → airport_code（quotes）
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_main_city_id_fkey;
ALTER TABLE quotes RENAME COLUMN main_city_id TO airport_code;

-- 5. itineraries 清理 proposal_package_id
ALTER TABLE itineraries DROP COLUMN IF EXISTS proposal_package_id;

-- 6. tour_requests 清理 proposal_package_id
ALTER TABLE tour_requests DROP COLUMN IF EXISTS proposal_package_id;

-- 7. 回填現有團的 airport_code（從城市 UUID 改為機場代號）
UPDATE tours SET airport_code = 'SGN' WHERE code = 'SGN260331A';
UPDATE tours SET airport_code = 'OKA' WHERE code = 'PROP-MMLMAU0H';
UPDATE tours SET airport_code = 'FUK' WHERE code = 'FUK260702A';
UPDATE tours SET airport_code = 'NGO' WHERE code = 'NGO260615A';
UPDATE tours SET airport_code = 'TW' WHERE code = 'TW260321A';
UPDATE tours SET airport_code = 'PVG' WHERE code = 'PVG260318A';
