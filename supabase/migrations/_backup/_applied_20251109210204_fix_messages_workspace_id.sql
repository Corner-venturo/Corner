-- Fix messages table workspace_id (disable trigger)

SET session_replication_role = replica;

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
  SET workspace_id = default_workspace_id 
  WHERE workspace_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % messages', updated_count;
END $$;

SET session_replication_role = DEFAULT;
