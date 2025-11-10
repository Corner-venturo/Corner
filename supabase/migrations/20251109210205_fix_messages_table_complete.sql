-- Fix messages table: add updated_at and fill workspace_id

BEGIN;

-- Step 1: Add updated_at column if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Step 2: Fill workspace_id with trigger now working
DO $$
DECLARE
  default_workspace_id uuid;
  updated_count integer;
BEGIN
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  UPDATE public.messages 
  SET workspace_id = default_workspace_id,
      updated_at = COALESCE(edited_at::timestamptz, created_at::timestamptz, now())
  WHERE workspace_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Updated % messages with workspace_id', updated_count;
END $$;

COMMIT;
