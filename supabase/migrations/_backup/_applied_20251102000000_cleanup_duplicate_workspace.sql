-- 清理重複的 Workspace 和相關資料
-- 保留: workspace-001 (總部辦公室)
-- 刪除: a0000000-0000-0000-0000-000000000001 (工作空間) 及其所有相關資料

BEGIN;

-- 1. 刪除相關的 messages (訊息)
DELETE FROM public.messages 
WHERE channel_id IN (
  SELECT id FROM public.channels 
  WHERE workspace_id = 'a0000000-0000-0000-0000-000000000001'
);

-- 2. 刪除相關的 channel_members (頻道成員)
DELETE FROM public.channel_members 
WHERE workspace_id = 'a0000000-0000-0000-0000-000000000001';

-- 3. 刪除相關的 advance_lists (代墊清單)
DELETE FROM public.advance_lists 
WHERE channel_id IN (
  SELECT id FROM public.channels 
  WHERE workspace_id = 'a0000000-0000-0000-0000-000000000001'
);

-- 4. 刪除相關的 shared_order_lists (分享訂單清單)
DELETE FROM public.shared_order_lists 
WHERE channel_id IN (
  SELECT id FROM public.channels 
  WHERE workspace_id = 'a0000000-0000-0000-0000-000000000001'
);

-- 5. 刪除相關的 channels (頻道)
DELETE FROM public.channels 
WHERE workspace_id = 'a0000000-0000-0000-0000-000000000001';

-- 6. 刪除相關的 channel_groups (群組)
DELETE FROM public.channel_groups 
WHERE workspace_id = 'a0000000-0000-0000-0000-000000000001';

-- 7. 刪除 workspace
DELETE FROM public.workspaces 
WHERE id = 'a0000000-0000-0000-0000-000000000001';

COMMIT;
