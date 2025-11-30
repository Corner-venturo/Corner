-- 為 itineraries 表格添加作者欄位
BEGIN;

-- 添加 created_by 欄位（用戶 ID，使用 uuid 類型匹配 auth.users.id）
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 添加 author_name 欄位（用戶名稱，避免額外查詢）
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS author_name text;

-- 添加註釋
COMMENT ON COLUMN public.itineraries.created_by IS '創建者用戶 ID';
COMMENT ON COLUMN public.itineraries.author_name IS '創建者名稱（快取，避免 JOIN）';

-- 創建索引
CREATE INDEX IF NOT EXISTS itineraries_created_by_idx ON public.itineraries(created_by);

COMMIT;
