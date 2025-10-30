-- 創建公司公告群組和頻道
BEGIN;

-- 獲取第一個 workspace（通常是總部辦公室）
DO $$
DECLARE
  v_workspace_id UUID;
  v_group_id UUID;
  v_channel_id UUID;
BEGIN
  -- 1. 獲取第一個 workspace ID
  SELECT id INTO v_workspace_id
  FROM public.workspaces
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No active workspace found';
  END IF;

  RAISE NOTICE 'Using workspace ID: %', v_workspace_id;

  -- 2. 創建「公司公告」群組（如果不存在）
  INSERT INTO public.channel_groups (id, workspace_id, name, "order", is_collapsed, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_workspace_id,
    '📢 公司公告',
    0,  -- 最高優先順序，置頂
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (workspace_id, name) DO NOTHING
  RETURNING id INTO v_group_id;

  -- 如果群組已存在，獲取其 ID
  IF v_group_id IS NULL THEN
    SELECT id INTO v_group_id
    FROM public.channel_groups
    WHERE workspace_id = v_workspace_id AND name = '📢 公司公告'
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Group ID: %', v_group_id;

  -- 3. 創建「總部辦公室」頻道（如果不存在）
  INSERT INTO public.channels (id, workspace_id, name, description, type, group_id, is_favorite, "order", created_at)
  VALUES (
    gen_random_uuid(),
    v_workspace_id,
    '🏢 總部辦公室',
    '公司重要公告與全體通知',
    'public',
    v_group_id,
    true,  -- 標記為最愛（置頂效果）
    0,
    NOW()
  )
  ON CONFLICT (workspace_id, name) DO NOTHING
  RETURNING id INTO v_channel_id;

  -- 如果頻道已存在，獲取其 ID
  IF v_channel_id IS NULL THEN
    SELECT id INTO v_channel_id
    FROM public.channels
    WHERE workspace_id = v_workspace_id AND name = '🏢 總部辦公室'
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Channel ID: %', v_channel_id;

  -- 4. 自動將所有員工加入「總部辦公室」頻道
  INSERT INTO public.channel_members (workspace_id, channel_id, employee_id, role, status)
  SELECT
    v_workspace_id,
    v_channel_id,
    users.id,
    'member',
    'active'
  FROM public.users
  ON CONFLICT (workspace_id, channel_id, employee_id) DO NOTHING;

  RAISE NOTICE 'Added all users to headquarters channel';
END $$;

COMMIT;
