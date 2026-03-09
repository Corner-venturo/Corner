-- Migration: Add foreign key constraint for receipt_payment_items.receipt_id
-- Date: 2026-03-09
-- Issue: PostgREST cannot perform nested select without explicit FK relationship

-- Add foreign key constraint
ALTER TABLE receipt_payment_items
ADD CONSTRAINT receipt_payment_items_receipt_id_fkey
FOREIGN KEY (receipt_id) REFERENCES receipts(id)
ON DELETE CASCADE;

-- Verify the constraint was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'receipt_payment_items_receipt_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint was not added successfully';
  END IF;
  
  RAISE NOTICE 'Foreign key constraint added successfully';
END $$;
