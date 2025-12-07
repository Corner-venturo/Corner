-- 建立討論串 (channel_threads) 資料表
-- 讓頻道可以有多個獨立的討論串

BEGIN;

-- 建立 channel_threads 資料表
CREATE TABLE IF NOT EXISTS public.channel_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.employees(id),
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- 軟刪除欄位
  _deleted boolean DEFAULT false,
  _needs_sync boolean DEFAULT false,
  _synced_at timestamptz
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_channel_threads_channel_id ON public.channel_threads(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_threads_created_by ON public.channel_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_channel_threads_created_at ON public.channel_threads(created_at DESC);

-- 新增 thread_id 欄位到 messages 資料表
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.channel_threads(id) ON DELETE CASCADE;

-- 建立 thread_id 索引
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);

-- 新增 reply_count 到 channel_threads（方便顯示回覆數）
ALTER TABLE public.channel_threads
ADD COLUMN IF NOT EXISTS reply_count integer DEFAULT 0;

-- 新增 last_reply_at 到 channel_threads（方便排序）
ALTER TABLE public.channel_threads
ADD COLUMN IF NOT EXISTS last_reply_at timestamptz;

-- 建立觸發器：更新討論串的回覆數和最後回覆時間
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE public.channel_threads
    SET
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      updated_at = now()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' AND OLD.thread_id IS NOT NULL THEN
    UPDATE public.channel_threads
    SET
      reply_count = GREATEST(reply_count - 1, 0),
      updated_at = now()
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_stats ON public.messages;
CREATE TRIGGER trigger_update_thread_stats
AFTER INSERT OR DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_stats();

-- 新增欄位註解
COMMENT ON TABLE public.channel_threads IS '頻道討論串';
COMMENT ON COLUMN public.channel_threads.id IS '討論串 ID';
COMMENT ON COLUMN public.channel_threads.channel_id IS '所屬頻道 ID';
COMMENT ON COLUMN public.channel_threads.name IS '討論串名稱';
COMMENT ON COLUMN public.channel_threads.created_by IS '建立者 ID';
COMMENT ON COLUMN public.channel_threads.reply_count IS '回覆數量';
COMMENT ON COLUMN public.channel_threads.last_reply_at IS '最後回覆時間';
COMMENT ON COLUMN public.messages.thread_id IS '所屬討論串 ID（null 表示主頻道訊息）';

-- RLS: 禁用（依照 Venturo 規範）
ALTER TABLE public.channel_threads DISABLE ROW LEVEL SECURITY;

COMMIT;
