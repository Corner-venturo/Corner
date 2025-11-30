-- 簡化工作空間結構
-- 1. 刪除「公司公告」系統群組及其下的所有頻道
-- 2. 刪除「威廉群組」使用者群組
-- 3. 只保留「封存」群組

BEGIN;

-- 1. 刪除「公司公告」群組下的所有頻道的相關資料
DELETE FROM public.messages 
WHERE channel_id IN (
  SELECT c.id FROM public.channels c
  JOIN public.channel_groups cg ON c.group_id = cg.id
  WHERE cg.system_type = 'company_announcements'
);

DELETE FROM public.channel_members 
WHERE channel_id IN (
  SELECT c.id FROM public.channels c
  JOIN public.channel_groups cg ON c.group_id = cg.id
  WHERE cg.system_type = 'company_announcements'
);

DELETE FROM public.channels 
WHERE group_id IN (
  SELECT id FROM public.channel_groups
  WHERE system_type = 'company_announcements'
);

-- 2. 刪除「公司公告」群組
DELETE FROM public.channel_groups 
WHERE system_type = 'company_announcements';

-- 3. 刪除「威廉群組」（使用者群組）
DELETE FROM public.channel_groups 
WHERE name = '威廉群組' AND is_system = false;

-- 4. 刪除其他所有使用者建立的群組（保留系統群組）
DELETE FROM public.channel_groups 
WHERE is_system = false OR is_system IS NULL;

COMMIT;
