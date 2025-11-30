-- 修正 messages 的級聯刪除
-- 當刪除 channel 時，自動刪除相關的 messages

BEGIN;

-- 1. 找出 messages.channel_id 的外鍵名稱並刪除
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_name = 'messages'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%channel_id%';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS %I', fk_name);
  END IF;
END $$;

-- 2. 重新建立 FK 並設定為 CASCADE
ALTER TABLE public.messages
ADD CONSTRAINT messages_channel_id_fkey
FOREIGN KEY (channel_id)
REFERENCES public.channels(id)
ON DELETE CASCADE;  -- 🔥 關鍵：當刪除 channel 時，自動刪除相關 messages

COMMENT ON CONSTRAINT messages_channel_id_fkey ON public.messages
IS 'Cascade delete messages when channel is deleted';

COMMIT;
