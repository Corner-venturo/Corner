-- ============================================
-- Complete Workspace Schema for Venturo
-- ============================================
-- This migration creates all necessary tables for the workspace feature
-- Including: workspaces, channels, channel_groups, channel_members, messages, bulletins

BEGIN;

-- ============================================
-- 1. Workspaces Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.workspaces IS 'Workspaces for organizing channels and teams';

-- ============================================
-- 2. Channel Groups Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.channel_groups (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_collapsed boolean DEFAULT false,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.channel_groups IS 'Groups for organizing channels within a workspace';

-- ============================================
-- 3. Channels Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.channels (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  group_id text REFERENCES public.channel_groups(id) ON DELETE SET NULL,
  tour_id text,
  is_favorite boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.channels IS 'Communication channels within workspaces';
COMMENT ON COLUMN public.channels.type IS 'public: visible to all, private: invite-only, direct: 1-on-1 chat';

-- ============================================
-- 4. Channel Members Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  channel_id text NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'guest')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'pending', 'suspended', 'removed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(workspace_id, channel_id, employee_id)
);

COMMENT ON TABLE public.channel_members IS 'Tracks which employees are members of which channels';

-- ============================================
-- 5. Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id text PRIMARY KEY,
  channel_id text NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  content text NOT NULL,
  reactions jsonb DEFAULT '{}'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.messages IS 'Messages sent in channels';

-- ============================================
-- 6. Bulletins Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.bulletins (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.bulletins IS 'Announcements and bulletins for workspaces';

-- ============================================
-- 7. Advance Lists Table (代墊清單)
-- ============================================
CREATE TABLE IF NOT EXISTS public.advance_lists (
  id text PRIMARY KEY,
  channel_id text NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  author_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.advance_lists IS 'Advance payment lists shared in channels';

-- ============================================
-- 8. Shared Order Lists Table (分享訂單列表)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shared_order_lists (
  id text PRIMARY KEY,
  channel_id text NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  orders jsonb DEFAULT '[]'::jsonb,
  author_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.shared_order_lists IS 'Shared order lists in channels';

-- ============================================
-- Create Indexes
-- ============================================

-- Workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON public.workspaces(is_active);

-- Channel Groups
CREATE INDEX IF NOT EXISTS idx_channel_groups_workspace ON public.channel_groups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channel_groups_order ON public.channel_groups("order");

-- Channels
CREATE INDEX IF NOT EXISTS idx_channels_workspace ON public.channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channels_group ON public.channels(group_id);
CREATE INDEX IF NOT EXISTS idx_channels_tour ON public.channels(tour_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);

-- Channel Members
CREATE INDEX IF NOT EXISTS idx_channel_members_workspace ON public.channel_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_employee ON public.channel_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_status ON public.channel_members(status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON public.messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages(is_pinned) WHERE is_pinned = true;

-- Bulletins
CREATE INDEX IF NOT EXISTS idx_bulletins_workspace ON public.bulletins(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_priority ON public.bulletins(priority);
CREATE INDEX IF NOT EXISTS idx_bulletins_created ON public.bulletins(created_at DESC);

-- Advance Lists
CREATE INDEX IF NOT EXISTS idx_advance_lists_channel ON public.advance_lists(channel_id);
CREATE INDEX IF NOT EXISTS idx_advance_lists_author ON public.advance_lists(author_id);

-- Shared Order Lists
CREATE INDEX IF NOT EXISTS idx_shared_order_lists_channel ON public.shared_order_lists(channel_id);
CREATE INDEX IF NOT EXISTS idx_shared_order_lists_author ON public.shared_order_lists(author_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_order_lists ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated and anonymous users
-- (You mentioned you don't want strict RLS, so these allow all operations)

-- Workspaces
CREATE POLICY "Allow all operations on workspaces"
  ON public.workspaces FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Channel Groups
CREATE POLICY "Allow all operations on channel_groups"
  ON public.channel_groups FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Channels
CREATE POLICY "Allow all operations on channels"
  ON public.channels FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Channel Members
CREATE POLICY "Allow all operations on channel_members"
  ON public.channel_members FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Messages
CREATE POLICY "Allow all operations on messages"
  ON public.messages FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Bulletins
CREATE POLICY "Allow all operations on bulletins"
  ON public.bulletins FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Advance Lists
CREATE POLICY "Allow all operations on advance_lists"
  ON public.advance_lists FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- Shared Order Lists
CREATE POLICY "Allow all operations on shared_order_lists"
  ON public.shared_order_lists FOR ALL
  TO authenticated, anon
  USING (true) WITH CHECK (true);

-- ============================================
-- Insert Default Data
-- ============================================

-- Default workspace
INSERT INTO public.workspaces (id, name, description, icon, is_active)
VALUES ('workspace-001', '總部辦公室', 'Venturo 總部工作空間', '', true)
ON CONFLICT (id) DO NOTHING;

-- Default channels
INSERT INTO public.channels (id, workspace_id, name, description, type, created_by)
VALUES
  ('channel-general', 'workspace-001', '一般討論', '團隊日常交流頻道', 'public', 'system'),
  ('channel-announcements', 'workspace-001', '公告', '重要公告發布頻道', 'public', 'system')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================
-- Verification
-- ============================================
SELECT
  '✅ Workspace Schema 建立完成' as status,
  (SELECT COUNT(*) FROM public.workspaces) as workspaces_count,
  (SELECT COUNT(*) FROM public.channels) as channels_count,
  (SELECT COUNT(*) FROM public.channel_groups) as groups_count,
  (SELECT COUNT(*) FROM public.channel_members) as members_count;
