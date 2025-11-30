-- Add missing 'items' column to payment_requests table
-- Migration: 20251119170000

BEGIN;

-- Add items column (JSONB array to store payment request items)
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.payment_requests.items IS 'Payment request items as JSONB array';

COMMIT;
