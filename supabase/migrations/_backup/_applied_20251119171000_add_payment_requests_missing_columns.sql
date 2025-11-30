-- Add all missing columns to payment_requests table
-- Migration: 20251119171000

BEGIN;

-- Add note column
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS note text;

-- Add order_id column (orders.id is text type)
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS order_id text;

-- Add order_number column
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS order_number text;

-- Add budget_warning column
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS budget_warning boolean DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.payment_requests.note IS 'Payment request note';
COMMENT ON COLUMN public.payment_requests.order_id IS 'Related order ID';
COMMENT ON COLUMN public.payment_requests.order_number IS 'Related order number';
COMMENT ON COLUMN public.payment_requests.budget_warning IS 'Budget warning flag';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id ON public.payment_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_number ON public.payment_requests(order_number);

COMMIT;
