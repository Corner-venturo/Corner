-- 開啟 messages 表格的 Realtime 功能
-- 讓前端可以即時接收訊息更新

BEGIN;

-- 確保 messages 表格存在後，將它加入 Realtime publication
-- Supabase 預設的 publication 名稱是 supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

COMMIT;
