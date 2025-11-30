-- Add order column to channels table for drag-and-drop sorting
BEGIN;

-- Add order column to channels table
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.channels."order" IS 'Display order for channels (used for drag-and-drop sorting)';

-- Update existing channels to have sequential order
UPDATE public.channels
SET "order" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at) - 1 AS row_num
  FROM public.channels
) AS subquery
WHERE channels.id = subquery.id;

COMMIT;
