-- 啟用 todos 表的 Realtime
-- Supabase Realtime 需要表格設定 REPLICA IDENTITY FULL

BEGIN;

-- 設定 REPLICA IDENTITY FULL（讓 Realtime 能追蹤所有欄位變更）
ALTER TABLE public.todos REPLICA IDENTITY FULL;

-- 確保表格已加入 Realtime publication（Supabase 預設會自動加入）
-- 如果沒有，手動加入
DO $$
BEGIN
  -- 檢查 supabase_realtime publication 是否存在
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- 如果 todos 還沒加入，加入它
    -- 這個指令是安全的，如果已存在會被忽略
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- 已經存在，忽略錯誤
    NULL;
END $$;

COMMIT;
