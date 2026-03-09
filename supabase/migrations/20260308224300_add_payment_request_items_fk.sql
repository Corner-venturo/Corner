-- Migration: Add foreign key constraint for payment_request_items.request_id
-- Date: 2026-03-08
-- Issue: PostgREST cannot perform nested select without explicit FK relationship

-- Add foreign key constraint
ALTER TABLE payment_request_items
ADD CONSTRAINT payment_request_items_request_id_fkey
FOREIGN KEY (request_id) REFERENCES payment_requests(id)
ON DELETE CASCADE;

-- Verify the constraint was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_request_items_request_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint was not added successfully';
  END IF;
  
  RAISE NOTICE 'Foreign key constraint added successfully';
END $$;
