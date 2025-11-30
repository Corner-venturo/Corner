-- Enable Realtime for calendar_events table
-- 為行事曆表格啟用 Realtime 功能

BEGIN;

-- 將 calendar_events 加入 supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;

COMMIT;
