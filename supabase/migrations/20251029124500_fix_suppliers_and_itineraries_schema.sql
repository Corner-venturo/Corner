-- Migration: 修复 suppliers 和 itineraries 表的所有缺失字段
-- Date: 2025-10-29

BEGIN;

-- ==========================================
-- 1. 修复 suppliers 表
-- ==========================================

-- 添加 country 字段
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS country text;

COMMENT ON COLUMN public.suppliers.country IS 'Supplier country';

-- 添加 region 字段（如果不存在）
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS region text;

COMMENT ON COLUMN public.suppliers.region IS 'Supplier region';

-- ==========================================
-- 2. 修复 itineraries 表 - 添加所有前端使用的字段
-- ==========================================

-- 基本信息字段
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS subtitle text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS "departureDate" text,
ADD COLUMN IF NOT EXISTS "tourCode" text,
ADD COLUMN IF NOT EXISTS "coverImage" text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text;

-- JSONB 字段
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS "outboundFlight" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "returnFlight" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "focusCards" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS leader jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "meetingInfo" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "itinerarySubtitle" text,
ADD COLUMN IF NOT EXISTS "dailyItinerary" jsonb DEFAULT '[]'::jsonb;

-- 添加注释
COMMENT ON COLUMN public.itineraries.tagline IS 'Itinerary tagline';
COMMENT ON COLUMN public.itineraries.title IS 'Itinerary title';
COMMENT ON COLUMN public.itineraries.subtitle IS 'Itinerary subtitle';
COMMENT ON COLUMN public.itineraries.description IS 'Itinerary description';
COMMENT ON COLUMN public.itineraries."departureDate" IS 'Departure date string';
COMMENT ON COLUMN public.itineraries."tourCode" IS 'Tour code';
COMMENT ON COLUMN public.itineraries."coverImage" IS 'Cover image URL';
COMMENT ON COLUMN public.itineraries.country IS 'Destination country';
COMMENT ON COLUMN public.itineraries.city IS 'Destination city';
COMMENT ON COLUMN public.itineraries."outboundFlight" IS 'Outbound flight information (JSON)';
COMMENT ON COLUMN public.itineraries."returnFlight" IS 'Return flight information (JSON)';
COMMENT ON COLUMN public.itineraries.features IS 'Itinerary features (JSON array)';
COMMENT ON COLUMN public.itineraries."focusCards" IS 'Focus cards for highlights (JSON array)';
COMMENT ON COLUMN public.itineraries.leader IS 'Tour leader information (JSON)';
COMMENT ON COLUMN public.itineraries."meetingInfo" IS 'Meeting information (JSON)';
COMMENT ON COLUMN public.itineraries."itinerarySubtitle" IS 'Itinerary subtitle';
COMMENT ON COLUMN public.itineraries."dailyItinerary" IS 'Daily itinerary details (JSON array)';

COMMIT;
