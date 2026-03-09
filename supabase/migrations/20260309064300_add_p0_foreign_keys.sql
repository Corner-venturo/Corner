-- Migration: Add P0 Foreign Keys (Core Business Logic)
-- Date: 2026-03-09
-- Priority: P0 - Critical for data integrity and display
-- 
-- Pre-check: Orphan records verified (all clean ✓)

-- ============================================================================
-- P0-1: Payment Request Items → Supplier
-- ============================================================================
ALTER TABLE payment_request_items
ADD CONSTRAINT payment_request_items_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
ON DELETE RESTRICT;

-- ============================================================================
-- P0-2: Payment Requests → Supplier
-- ============================================================================
ALTER TABLE payment_requests
ADD CONSTRAINT payment_requests_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
ON DELETE RESTRICT;

-- ============================================================================
-- P0-3: Payment Requests → Tour
-- ============================================================================
ALTER TABLE payment_requests
ADD CONSTRAINT payment_requests_tour_id_fkey
FOREIGN KEY (tour_id) REFERENCES tours(id)
ON DELETE CASCADE;

-- ============================================================================
-- P0-4: Payment Requests → Order
-- Note: order_id is text type, needs to match orders table
-- ============================================================================
-- Skip for now - need to verify orders.id is text or uuid
-- ALTER TABLE payment_requests
-- ADD CONSTRAINT payment_requests_order_id_fkey
-- FOREIGN KEY (order_id) REFERENCES orders(id)
-- ON DELETE CASCADE;

-- ============================================================================
-- P0-5: Receipts → Order
-- ============================================================================
ALTER TABLE receipts
ADD CONSTRAINT receipts_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- ============================================================================
-- P0-6: Receipts → Customer
-- ============================================================================
ALTER TABLE receipts
ADD CONSTRAINT receipts_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- ============================================================================
-- P0-7: Tour Members → Customer
-- ============================================================================
ALTER TABLE tour_members
ADD CONSTRAINT tour_members_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- ============================================================================
-- P0-8: Tour Members → Tour
-- ============================================================================
ALTER TABLE tour_members
ADD CONSTRAINT tour_members_tour_id_fkey
FOREIGN KEY (tour_id) REFERENCES tours(id)
ON DELETE CASCADE;

-- ============================================================================
-- P0-9: Quotes → Customer
-- Note: customer_id is text type
-- ============================================================================
-- Skip for now - need to verify customers.id type
-- ALTER TABLE quotes
-- ADD CONSTRAINT quotes_customer_id_fkey
-- FOREIGN KEY (customer_id) REFERENCES customers(id)
-- ON DELETE RESTRICT;

-- ============================================================================
-- P0-10: Quotes → Tour
-- Note: tour_id is text type
-- ============================================================================
-- Skip for now - need to verify tours.id type
-- ALTER TABLE quotes
-- ADD CONSTRAINT quotes_tour_id_fkey
-- FOREIGN KEY (tour_id) REFERENCES tours(id)
-- ON DELETE CASCADE;

-- ============================================================================
-- P0-11: Order Members → Customer
-- ============================================================================
ALTER TABLE order_members
ADD CONSTRAINT order_members_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- ============================================================================
-- P0-12: Order Members → Order
-- ============================================================================
ALTER TABLE order_members
ADD CONSTRAINT order_members_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  constraint_count INT;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname IN (
    'payment_request_items_supplier_id_fkey',
    'payment_requests_supplier_id_fkey',
    'payment_requests_tour_id_fkey',
    'receipts_order_id_fkey',
    'receipts_customer_id_fkey',
    'tour_members_customer_id_fkey',
    'tour_members_tour_id_fkey',
    'order_members_customer_id_fkey',
    'order_members_order_id_fkey'
  );
  
  IF constraint_count < 9 THEN
    RAISE EXCEPTION 'Not all constraints were created. Expected 9, got %', constraint_count;
  END IF;
  
  RAISE NOTICE 'Successfully added % P0 foreign key constraints', constraint_count;
END $$;

-- ============================================================================
-- Notes
-- ============================================================================
-- DELETE policy:
--   - RESTRICT: Cannot delete if referenced (suppliers, customers)
--   - CASCADE: Auto-delete related records (tours, orders)
-- 
-- Skipped (need type verification):
--   - payment_requests.order_id (text vs uuid?)
--   - quotes.customer_id (text vs uuid?)
--   - quotes.tour_id (text vs uuid?)
