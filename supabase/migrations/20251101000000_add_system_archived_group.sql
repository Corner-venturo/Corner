-- 為 channel_groups 新增 is_system 欄位，標記系統預設群組
-- 系統群組設計：
-- 1. 「公司公告」- 真實資料庫群組（is_system=true, system_type='company_announcements'）
-- 2. 「未加入」- 前端虛擬群組（不存資料庫，純前端過濾邏輯）
-- 3. 「封存」- 真實資料庫群組（is_system=true, system_type='archived'）用於放封存旅遊團的頻道

BEGIN;

-- 1. 新增 is_system 欄位（標記不可刪除的系統群組）
ALTER TABLE public.channel_groups
ADD COLUMN IF NOT EXISTS "is_system" boolean DEFAULT false;

COMMENT ON COLUMN public.channel_groups."is_system" IS 'System-level channel group that cannot be deleted by users';

-- 2. 新增 system_type 欄位來區分系統群組類型
ALTER TABLE public.channel_groups
ADD COLUMN IF NOT EXISTS "system_type" text;

COMMENT ON COLUMN public.channel_groups."system_type" IS 'Type of system group: company_announcements, archived (null for user-created groups)';

-- 3. 為每個 workspace 建立「封存」系統群組（如果不存在）
--    用途：存放封存旅遊團的頻道
INSERT INTO public.channel_groups (workspace_id, name, is_system, system_type, "order")
SELECT
  w.id,
  '封存',
  true,
  'archived',
  999
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_groups cg
  WHERE cg.workspace_id = w.id
  AND cg.system_type = 'archived'
);

-- 4. 為每個 workspace 建立「公司公告」系統群組（如果不存在）
--    用途：存放全公司公告頻道
INSERT INTO public.channel_groups (workspace_id, name, is_system, system_type, "order")
SELECT
  w.id,
  '公司公告',
  true,
  'company_announcements',
  0
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_groups cg
  WHERE cg.workspace_id = w.id
  AND cg.system_type = 'company_announcements'
);

-- 5. 更新現有的同名群組為系統群組（避免重複）
UPDATE public.channel_groups
SET is_system = true, system_type = 'company_announcements', "order" = 0
WHERE name = '公司公告' AND system_type IS NULL;

UPDATE public.channel_groups
SET is_system = true, system_type = 'archived', "order" = 999
WHERE name = '封存' AND system_type IS NULL;

-- 6. 新增約束：每個 workspace 只能有一個 archived 和 company_announcements 群組
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_groups_workspace_system_type
ON public.channel_groups (workspace_id, system_type)
WHERE system_type IS NOT NULL;

COMMIT;
