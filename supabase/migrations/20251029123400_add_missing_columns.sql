-- Migration: 修復 suppliers 和 itineraries 表的缺失字段
-- Date: 2025-10-29

BEGIN;

-- 1. 為 suppliers 表新增 contact 欄位（JSONB 類型）
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS contact jsonb DEFAULT '{
  "contact_person": "",
  "phone": "",
  "email": "",
  "address": "",
  "website": ""
}'::jsonb;

COMMENT ON COLUMN public.suppliers.contact IS 'Contact information stored as JSON';

-- 2. 為 itineraries 表新增 code 欄位
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS code text;

COMMENT ON COLUMN public.itineraries.code IS 'Legacy code field for backward compatibility';

-- 3. 為已存在的 itineraries 記錄生成 code（如果為 null）
WITH numbered_rows AS (
  SELECT id, 'ITN' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') AS new_code
  FROM public.itineraries
  WHERE code IS NULL
)
UPDATE public.itineraries
SET code = numbered_rows.new_code
FROM numbered_rows
WHERE itineraries.id = numbered_rows.id;

COMMIT;
