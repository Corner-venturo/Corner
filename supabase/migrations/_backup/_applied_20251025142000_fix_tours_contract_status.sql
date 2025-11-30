-- Fix tours contract_status check constraint
-- Remove the constraint and allow any value

DO $$
BEGIN
  -- Drop the existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tours_contract_status_check'
    AND table_name = 'tours'
  ) THEN
    ALTER TABLE public.tours DROP CONSTRAINT tours_contract_status_check;
  END IF;
END $$;

-- Add a more permissive constraint or no constraint at all
-- If you want to keep some validation, uncomment and modify this:
-- ALTER TABLE public.tours ADD CONSTRAINT tours_contract_status_check
--   CHECK (contract_status IN ('未簽約', '已簽約', '已完成', 'not_signed', 'signed', 'completed'));

-- Or just allow any text value (no constraint)
