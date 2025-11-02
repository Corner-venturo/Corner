-- 重新建立預設頻道
-- 為「總部辦公室」workspace 建立「一般討論」頻道

BEGIN;

-- 為「總部辦公室」建立預設頻道（放在「公司公告」群組）
INSERT INTO public.channels (
  workspace_id,
  name,
  description,
  type,
  group_id
)
SELECT
  w.id as workspace_id,
  '一般討論' as name,
  '團隊日常交流頻道' as description,
  'public' as type,
  cg.id as group_id
FROM public.workspaces w
CROSS JOIN public.channel_groups cg
WHERE w.name = '總部辦公室'
  AND cg.system_type = 'company_announcements'
  AND cg.workspace_id = w.id
  AND NOT EXISTS (
    SELECT 1 FROM public.channels ch
    WHERE ch.workspace_id = w.id
    AND ch.name = '一般討論'
  );

COMMIT;
