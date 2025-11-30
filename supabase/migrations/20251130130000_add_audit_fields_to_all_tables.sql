-- 補齊所有表格的審計欄位 (created_by, updated_by)
BEGIN;

-- tours
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- itineraries
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- order_members
ALTER TABLE public.order_members
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- quotes
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- quote_items
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- payment_requests
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- disbursement_orders
ALTER TABLE public.disbursement_orders
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- receipt_orders
ALTER TABLE public.receipt_orders
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- suppliers
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- visas
ALTER TABLE public.visas
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- calendar_events
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- channels
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- todos
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

COMMIT;
