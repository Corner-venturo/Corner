-- Fix payment_requests note field duplication
-- Migration: 20251119172000
-- Issue: Both 'note' and 'notes' columns exist, causing confusion

BEGIN;

-- Check if notes column exists and has data
DO $$
BEGIN
  -- If notes has data and note is empty, copy notes to note
  UPDATE public.payment_requests
  SET note = COALESCE(notes, note)
  WHERE notes IS NOT NULL AND note IS NULL;
END $$;

-- Drop the notes column (we use 'note' as the standard)
ALTER TABLE public.payment_requests
DROP COLUMN IF EXISTS notes;

-- Ensure note column exists
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS note text;

-- Update comment
COMMENT ON COLUMN public.payment_requests.note IS 'Payment request note (備註)';

COMMIT;
