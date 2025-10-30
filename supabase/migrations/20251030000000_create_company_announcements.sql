-- 創建公司公告群組和頻道
-- 注意：此 migration 會在第一個 workspace 中創建公告群組
BEGIN;

-- 1. 創建「公司公告」群組（使用第一個 workspace）
WITH first_workspace AS (
  SELECT id FROM public.workspaces
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1
),
new_group AS (
  INSERT INTO public.channel_groups (id, workspace_id, name, "order", is_collapsed, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    first_workspace.id,
    '📢 公司公告',
    0,
    false,
    NOW(),
    NOW()
  FROM first_workspace
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_groups cg, first_workspace fw
    WHERE cg.workspace_id = fw.id AND cg.name = '📢 公司公告'
  )
  RETURNING id, workspace_id
),
existing_group AS (
  SELECT cg.id, cg.workspace_id
  FROM public.channel_groups cg, first_workspace fw
  WHERE cg.workspace_id = fw.id AND cg.name = '📢 公司公告'
),
selected_group AS (
  SELECT * FROM new_group
  UNION ALL
  SELECT * FROM existing_group
  LIMIT 1
),
-- 2. 創建「總部辦公室」頻道
new_channel AS (
  INSERT INTO public.channels (id, workspace_id, name, description, type, group_id, is_favorite, "order", created_at)
  SELECT
    gen_random_uuid(),
    sg.workspace_id,
    '🏢 總部辦公室',
    '公司重要公告與全體通知',
    'public',
    sg.id,
    true,
    0,
    NOW()
  FROM selected_group sg
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channels c, selected_group sg2
    WHERE c.workspace_id = sg2.workspace_id AND c.name = '🏢 總部辦公室'
  )
  RETURNING id, workspace_id
),
existing_channel AS (
  SELECT c.id, c.workspace_id
  FROM public.channels c, selected_group sg
  WHERE c.workspace_id = sg.workspace_id AND c.name = '🏢 總部辦公室'
),
selected_channel AS (
  SELECT * FROM new_channel
  UNION ALL
  SELECT * FROM existing_channel
  LIMIT 1
)
-- 3. 自動將所有員工加入「總部辦公室」頻道
INSERT INTO public.channel_members (workspace_id, channel_id, employee_id, role, status)
SELECT
  sc.workspace_id,
  sc.id,
  u.id,
  'member',
  'active'
FROM selected_channel sc
CROSS JOIN public.users u
ON CONFLICT (workspace_id, channel_id, employee_id) DO NOTHING;

COMMIT;
