-- 新增頻道置頂和封存欄位
-- 用途：
-- - is_pinned: 置頂頻道（取代 is_favorite）
-- - is_archived: 封存狀態（明確標記，不只依賴 group_id）
-- - archived_at: 封存時間

BEGIN;

-- 1. 新增 is_pinned 欄位（置頂功能）
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false;

COMMENT ON COLUMN public.channels."is_pinned" IS 'Channel is pinned to top of its group';

-- 2. 新增 is_archived 欄位（封存狀態）
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false;

COMMENT ON COLUMN public.channels."is_archived" IS 'Channel is archived (tour archived or manually archived)';

-- 3. 新增 archived_at 欄位（封存時間）
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "archived_at" timestamptz;

COMMENT ON COLUMN public.channels."archived_at" IS 'Timestamp when channel was archived';

-- 4. 將現有的 is_favorite 資料遷移到 is_pinned
UPDATE public.channels
SET is_pinned = is_favorite
WHERE is_favorite = true;

-- 5. 將封存群組中的頻道標記為已封存
UPDATE public.channels
SET
  is_archived = true,
  archived_at = NOW()
WHERE group_id IN (
  SELECT id FROM public.channel_groups
  WHERE system_type = 'archived'
);

-- 6. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_channels_is_pinned
ON public.channels (is_pinned)
WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_channels_is_archived
ON public.channels (is_archived)
WHERE is_archived = true;

COMMIT;
