-- Create channel_members table for workspace member management
-- This table tracks which employees are members of which channels

CREATE TABLE IF NOT EXISTS public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  channel_id text NOT NULL,
  employee_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE(workspace_id, channel_id, employee_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_channel_members_workspace ON public.channel_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_employee ON public.channel_members(employee_id);

-- Add RLS policies (disable RLS for now, enable later when needed)
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read channel members
CREATE POLICY "Allow authenticated users to read channel members"
  ON public.channel_members
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow all authenticated users to insert channel members
CREATE POLICY "Allow authenticated users to insert channel members"
  ON public.channel_members
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow all authenticated users to update channel members
CREATE POLICY "Allow authenticated users to update channel members"
  ON public.channel_members
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to delete channel members
CREATE POLICY "Allow authenticated users to delete channel members"
  ON public.channel_members
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Add comment
COMMENT ON TABLE public.channel_members IS 'Tracks which employees are members of which channels in workspaces';
