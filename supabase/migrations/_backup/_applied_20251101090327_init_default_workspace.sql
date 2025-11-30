BEGIN;

-- 建立預設工作空間（如果不存在）
INSERT INTO public.workspaces (id, name, icon, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '工作空間',
  '🏢',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 建立「📢 公司公告」群組（如果不存在）
INSERT INTO public.channel_groups (id, workspace_id, name, "order", is_collapsed, created_at, updated_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '📢 公司公告',
  -999,
  false,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 建立「🏢 總部辦公室」頻道（如果不存在）
INSERT INTO public.channels (id, workspace_id, group_id, name, description, type, is_favorite, "order", created_at, updated_at)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  '🏢 總部辦公室',
  '公司重要公告與全體通知',
  'public',
  true,
  0,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
