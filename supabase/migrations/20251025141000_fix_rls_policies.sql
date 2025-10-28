-- Fix RLS policies for channel_members table
-- Grant necessary permissions and simplify policies

-- First, grant permissions on the schema and table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.channel_members TO anon, authenticated;
GRANT ALL ON public.channels TO anon, authenticated;
GRANT ALL ON public.workspaces TO anon, authenticated;
GRANT ALL ON public.channel_groups TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.bulletins TO anon, authenticated;
GRANT ALL ON public.advance_lists TO anon, authenticated;
GRANT ALL ON public.shared_order_lists TO anon, authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Allow authenticated users to insert channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Allow authenticated users to update channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Allow authenticated users to delete channel members" ON public.channel_members;

-- Create simple, permissive policies (as per your requirement: no strict RLS)
CREATE POLICY "Allow all operations on channel_members"
  ON public.channel_members
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but policies are permissive
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Also check other workspace tables have permissive policies
DO $$
BEGIN
  -- Drop and recreate permissive policies for all workspace tables

  -- Workspaces
  DROP POLICY IF EXISTS "Allow all operations on workspaces" ON public.workspaces;
  CREATE POLICY "Allow all operations on workspaces"
    ON public.workspaces FOR ALL TO public USING (true) WITH CHECK (true);

  -- Channels
  DROP POLICY IF EXISTS "Allow all operations on channels" ON public.channels;
  CREATE POLICY "Allow all operations on channels"
    ON public.channels FOR ALL TO public USING (true) WITH CHECK (true);

  -- Channel Groups
  DROP POLICY IF EXISTS "Allow all operations on channel_groups" ON public.channel_groups;
  CREATE POLICY "Allow all operations on channel_groups"
    ON public.channel_groups FOR ALL TO public USING (true) WITH CHECK (true);

  -- Messages
  DROP POLICY IF EXISTS "Allow all operations on messages" ON public.messages;
  CREATE POLICY "Allow all operations on messages"
    ON public.messages FOR ALL TO public USING (true) WITH CHECK (true);

  -- Bulletins
  DROP POLICY IF EXISTS "Allow all operations on bulletins" ON public.bulletins;
  CREATE POLICY "Allow all operations on bulletins"
    ON public.bulletins FOR ALL TO public USING (true) WITH CHECK (true);

  -- Advance Lists
  DROP POLICY IF EXISTS "Allow all operations on advance_lists" ON public.advance_lists;
  CREATE POLICY "Allow all operations on advance_lists"
    ON public.advance_lists FOR ALL TO public USING (true) WITH CHECK (true);

  -- Shared Order Lists
  DROP POLICY IF EXISTS "Allow all operations on shared_order_lists" ON public.shared_order_lists;
  CREATE POLICY "Allow all operations on shared_order_lists"
    ON public.shared_order_lists FOR ALL TO public USING (true) WITH CHECK (true);
END $$;
