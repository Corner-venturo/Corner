-- Fix channel_members column types to match existing tables

-- First, convert channel_id from text to uuid
DO $$
BEGIN
  -- Check current type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'channel_members'
    AND column_name = 'channel_id'
    AND data_type = 'text'
  ) THEN
    -- Convert text to uuid
    ALTER TABLE public.channel_members
    ALTER COLUMN channel_id TYPE uuid USING channel_id::uuid;
  END IF;
END $$;

-- Convert workspace_id from text to uuid if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'channel_members'
    AND column_name = 'workspace_id'
    AND data_type = 'text'
  ) THEN
    -- Check if workspaces.id is uuid
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'workspaces'
      AND column_name = 'id'
      AND data_type = 'uuid'
    ) THEN
      ALTER TABLE public.channel_members
      ALTER COLUMN workspace_id TYPE uuid USING workspace_id::uuid;
    END IF;
  END IF;
END $$;

-- Now add foreign keys with correct types
DO $$
BEGIN
  -- Add foreign key from channel_members to employees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'channel_members_employee_id_fkey'
    AND table_name = 'channel_members'
  ) THEN
    ALTER TABLE public.channel_members
    ADD CONSTRAINT channel_members_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key from channel_members to channels
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'channel_members_channel_id_fkey'
    AND table_name = 'channel_members'
  ) THEN
    ALTER TABLE public.channel_members
    ADD CONSTRAINT channel_members_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key from channel_members to workspaces (only if both are uuid)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'channel_members_workspace_id_fkey'
    AND table_name = 'channel_members'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns c1
      JOIN information_schema.columns c2 ON true
      WHERE c1.table_schema = 'public'
      AND c1.table_name = 'channel_members'
      AND c1.column_name = 'workspace_id'
      AND c2.table_schema = 'public'
      AND c2.table_name = 'workspaces'
      AND c2.column_name = 'id'
      AND c1.data_type = c2.data_type
    ) THEN
      ALTER TABLE public.channel_members
      ADD CONSTRAINT channel_members_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
