-- Fix advance_lists table schema
-- Add missing author_id column if it doesn't exist

DO $$
BEGIN
  -- Add author_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'advance_lists'
    AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.advance_lists ADD COLUMN author_id text NOT NULL DEFAULT '';
  END IF;

  -- Add index for author_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'advance_lists'
    AND indexname = 'idx_advance_lists_author'
  ) THEN
    CREATE INDEX idx_advance_lists_author ON public.advance_lists(author_id);
  END IF;
END $$;

-- Fix shared_order_lists table schema
DO $$
BEGIN
  -- Add author_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shared_order_lists'
    AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.shared_order_lists ADD COLUMN author_id text NOT NULL DEFAULT '';
  END IF;

  -- Add index for author_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'shared_order_lists'
    AND indexname = 'idx_shared_order_lists_author'
  ) THEN
    CREATE INDEX idx_shared_order_lists_author ON public.shared_order_lists(author_id);
  END IF;
END $$;

-- Fix messages table - add missing indexes
DO $$
BEGIN
  -- Add author index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'messages'
    AND indexname = 'idx_messages_author'
  ) THEN
    CREATE INDEX idx_messages_author ON public.messages(author_id);
  END IF;

  -- Add created_at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'messages'
    AND indexname = 'idx_messages_created'
  ) THEN
    CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
  END IF;
END $$;

-- Fix bulletins table - add missing indexes
DO $$
BEGIN
  -- Add priority index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'bulletins'
    AND indexname = 'idx_bulletins_priority'
  ) THEN
    CREATE INDEX idx_bulletins_priority ON public.bulletins(priority);
  END IF;

  -- Add created_at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'bulletins'
    AND indexname = 'idx_bulletins_created'
  ) THEN
    CREATE INDEX idx_bulletins_created ON public.bulletins(created_at DESC);
  END IF;
END $$;

-- Fix channels table - add missing indexes
DO $$
BEGIN
  -- Add type index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'channels'
    AND indexname = 'idx_channels_type'
  ) THEN
    CREATE INDEX idx_channels_type ON public.channels(type);
  END IF;
END $$;

-- Fix channel_members table - add missing index
DO $$
BEGIN
  -- Add status index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'channel_members'
    AND indexname = 'idx_channel_members_status'
  ) THEN
    CREATE INDEX idx_channel_members_status ON public.channel_members(status);
  END IF;
END $$;

-- Fix workspaces table - add missing index
DO $$
BEGIN
  -- Add is_active index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'workspaces'
    AND indexname = 'idx_workspaces_active'
  ) THEN
    CREATE INDEX idx_workspaces_active ON public.workspaces(is_active);
  END IF;
END $$;
